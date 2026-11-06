import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationCode } from "@/lib/emailVerification";
import { PATCH as learnerProfile } from "@/app/api/learner/profile/route";
import { PATCH as tutorProfile } from "@/app/api/tutor/profile/route";
import { POST as sendCode } from "@/app/api/user/recovery-email/route";
import { POST as verify } from "@/app/api/user/recovery-email/verify/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
const sessions = new AsyncLocalStorage<{ user: { id: string; role: string } }>();
const mocks = vi.hoisted(() => ({ mail: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => sessions.getStore() ?? null }));
vi.mock("@/lib/mail", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/mail")>(), sendMail: mocks.mail }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB verified recovery email", () => {
  const users: string[] = [];const emails: string[] = [];
  let backup: string;
  const password = "RecoveryOwner!2026";
  const req = (body: unknown) => new NextRequest("http://localhost/qa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const asUser = <T>(index: number, fn: () => T) => sessions.run({ user: { id: users[index], role: index === 0 ? "STUDENT_LEARNER" : "STUDENT_TUTOR" } }, fn);
  const codeFromMail = () => { const code = mocks.mail.mock.calls.at(-1)?.[0].text.match(/\b\d{6}\b/)?.[0]; if (!code) throw Error("Verification mail missing code"); return code; };
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");backup = `qa-recovery-${suffix}@example.test`;
    const hash = await bcrypt.hash(password, 4);
    for (let i = 0; i < 2; i++) {
      emails.push(`qa-recovery-${suffix}-${i}@example.test`);
      const user = await prisma.user.create({ data: { anonymousId: `QA-RC-${suffix}-${i}`, email: emails[i], firstName: "QA", lastName: "Recovery", password: hash, role: i === 0 ? "STUDENT_LEARNER" : "STUDENT_TUTOR", gradeLevel: "GRADE_10", section: "QA" } });users.push(user.id);
    }
  });
  beforeEach(async () => {
    mocks.mail.mockReset();mocks.mail.mockResolvedValue(undefined);
    await prisma.recoveryEmailToken.deleteMany({ where: { userId: { in: users } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: users } } });
    await prisma.user.updateMany({ where: { id: { in: users } }, data: { recoveryEmail: null, recoveryEmailVerifiedAt: null } });
  });
  afterAll(async () => { if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });await prisma.$disconnect(); });
  it("persists both profile roles, requires the password, and rejects unverified recovery", async () => {
    expect((await asUser(0, () => learnerProfile(req({ recoveryEmail: backup, currentPassword: "wrong" })))).status).toBe(400);
    expect((await asUser(0, () => learnerProfile(req({ recoveryEmail: backup, currentPassword: password })))).status).toBe(200);
    expect((await asUser(1, () => tutorProfile(req({ recoveryEmail: backup, currentPassword: password })))).status).toBe(200);
    expect(await prisma.user.count({ where: { id: { in: users }, recoveryEmail: backup, recoveryEmailVerifiedAt: null } })).toBe(2);
    expect((await forgot(req({ email: backup }))).status).toBe(404);
    expect(mocks.mail).not.toHaveBeenCalled();
    expect(await prisma.passwordResetToken.count({ where: { userId: { in: users } } })).toBe(0);
  });
  it("enables only verified ownership, rejects reuse, and clears verification after a change", async () => {
    await asUser(0, () => learnerProfile(req({ recoveryEmail: backup, currentPassword: password })));
    expect((await asUser(0, sendCode)).status).toBe(200);const code = codeFromMail();
    expect((await asUser(0, () => verify(req({ code })))).status).toBe(200);
    expect((await asUser(0, () => verify(req({ code })))).status).toBe(400);
    const verifiedAt = (await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).recoveryEmailVerifiedAt;
    expect(verifiedAt).not.toBeNull();
    await asUser(0, () => learnerProfile(req({ recoveryEmail: backup })));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).recoveryEmailVerifiedAt).toEqual(verifiedAt);
    expect((await forgot(req({ email: backup }))).status).toBe(200);
    expect(mocks.mail.mock.calls.at(-1)![0].to).toBe(backup);
    await asUser(0, () => learnerProfile(req({ recoveryEmail: `changed-${backup}`, currentPassword: password })));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).recoveryEmailVerifiedAt).toBeNull();
    expect((await forgot(req({ email: backup }))).status).toBe(404);
  });
  it("rejects ambiguous primary/verified recovery and duplicate recovery matches", async () => {
    await prisma.user.update({ where: { id: users[0] }, data: { recoveryEmail: emails[1], recoveryEmailVerifiedAt: new Date() } });
    expect((await forgot(req({ email: emails[1] }))).status).toBe(409);
    await prisma.user.updateMany({ where: { id: { in: users } }, data: { recoveryEmail: backup, recoveryEmailVerifiedAt: new Date() } });
    expect((await forgot(req({ email: backup }))).status).toBe(409);
    expect(mocks.mail).not.toHaveBeenCalled();expect(await prisma.passwordResetToken.count({ where: { userId: { in: users } } })).toBe(0);
  });
  it("rolls back consumption for a changed address and rejects expired codes", async () => {
    const token = await prisma.recoveryEmailToken.create({ data: { userId: users[0], email: backup, tokenHash: hashVerificationCode(backup, "123456"), expiresAt: new Date(Date.now() + 60000) } });
    await prisma.user.update({ where: { id: users[0] }, data: { recoveryEmail: `changed-${backup}` } });
    expect((await asUser(0, () => verify(req({ code: "123456" })))).status).toBe(400);
    expect((await prisma.recoveryEmailToken.findUniqueOrThrow({ where: { id: token.id } })).usedAt).toBeNull();
    await prisma.user.update({ where: { id: users[0] }, data: { recoveryEmail: backup } });
    await prisma.recoveryEmailToken.update({ where: { id: token.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    expect((await asUser(0, () => verify(req({ code: "123456" })))).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).recoveryEmailVerifiedAt).toBeNull();
  });
  it("reports mail delivery failure without enabling recovery", async () => {
    await prisma.user.update({ where: { id: users[0] }, data: { recoveryEmail: backup } });
    mocks.mail.mockRejectedValueOnce(new Error("isolated delivery failure"));
    expect((await asUser(0, sendCode)).status).toBe(503);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).recoveryEmailVerifiedAt).toBeNull();
  });
  it("consumes a verification code once under concurrent requests", async () => {
    await prisma.user.update({ where: { id: users[0] }, data: { recoveryEmail: backup } });
    await prisma.recoveryEmailToken.create({ data: { userId: users[0], email: backup, tokenHash: hashVerificationCode(backup, "123456"), expiresAt: new Date(Date.now() + 60000) } });
    const responses = await asUser(0, () => Promise.all([verify(req({ code: "123456" })), verify(req({ code: "123456" }))]));
    expect(responses.map(r => r.status).sort()).toEqual([200, 400]);
  });
});
