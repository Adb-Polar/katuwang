import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/passwordReset";
import { POST } from "@/app/api/auth/reset-password/route";
const hooks = vi.hoisted(() => ({ duringHash: undefined as undefined | (() => Promise<void>) }));
vi.mock("bcryptjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("bcryptjs")>();
  return { ...actual, default: { ...actual.default, hash: async (password: string, rounds: number) => {
    if (rounds === 12) await hooks.duringHash?.();
    return actual.default.hash(password, rounds);
  } } };
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB reset token consumption", () => {
  let userId: string;let tokenId: string;let token: string;let originalHash: string;
  const reset = (password: string) => POST(new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }),
  }));
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");originalHash = await bcrypt.hash("OriginalResetQA!2026", 4);
    userId = (await prisma.user.create({ data: {
      anonymousId: `QA-P-${suffix}`, email: `qa-p-${suffix}@example.test`, firstName: "QA", lastName: "Reset",
      password: originalHash, role: "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA",
    } })).id;
  });
  beforeEach(async () => {
    hooks.duringHash = undefined;
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { password: originalHash, sessionVersion: 0 } });
    token = randomBytes(32).toString("hex");
    tokenId = (await prisma.passwordResetToken.create({ data: { userId, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + 60_000) } })).id;
  });
  afterAll(async () => { if (userId) await prisma.user.delete({ where: { id: userId } });await prisma.$disconnect(); });
  it("lets exactly one concurrent reset change the password and session version", async () => {
    const passwords = ["ResetWinnerA!2026", "ResetWinnerB!2026", "ResetWinnerC!2026", "ResetWinnerD!2026"];
    const responses = await Promise.all(passwords.map(reset));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 400, 400, 400]);
    const winner = responses.findIndex((r) => r.status === 200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await bcrypt.compare(passwords[winner], user.password)).toBe(true);expect(user.sessionVersion).toBe(1);
    expect((await prisma.passwordResetToken.findUniqueOrThrow({ where: { id: tokenId } })).usedAt).not.toBeNull();
    expect((await reset("UnusedRetry!2026")).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).password).toBe(user.password);
  });
  it("rejects a token that expires after the initial check and before consumption", async () => {
    hooks.duringHash = async () => { await prisma.passwordResetToken.update({ where: { id: tokenId }, data: { expiresAt: new Date(Date.now() - 1) } }); };
    expect((await reset("ExpiredResetQA!2026")).status).toBe(400);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.password).toBe(originalHash);expect(user.sessionVersion).toBe(0);
    expect((await prisma.passwordResetToken.findUniqueOrThrow({ where: { id: tokenId } })).usedAt).toBeNull();
  });
});
