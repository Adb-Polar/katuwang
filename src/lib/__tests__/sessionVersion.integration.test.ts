import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { changeOwnPassword } from "@/lib/changePassword";
import { hashResetToken } from "@/lib/passwordReset";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";

// Opt in explicitly against an isolated local database; never use application data.
describe.skipIf(!process.env.TEST_DATABASE_URL)("session version database integration", () => {
  let userId: string;
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL ||
        !["localhost", "127.0.0.1"].includes(url.hostname) ||
        !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(10).toString("hex");
    const user = await prisma.user.create({ data: {
      anonymousId: `QA-${suffix}`, email: `qa-${suffix}@example.test`,
      firstName: "QA", lastName: "Session", role: "STUDENT_LEARNER",
      gradeLevel: "GRADE_10", section: "QA",
      password: await bcrypt.hash("OldPassword123!", 4),
    } });
    userId = user.id;
  });
  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });
  it("increments the stored version alongside a password change", async () => {
    expect(await changeOwnPassword(userId, "OldPassword123!", "NewPassword123!")).toEqual({ ok: true });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.sessionVersion).toBe(1);
    expect(await bcrypt.compare("NewPassword123!", user.password)).toBe(true);
  });
  it("does not revoke sessions on a rejected password change", async () => {
    expect(await changeOwnPassword(userId, "WrongPassword123!", "UnusedPassword123!"))
      .toEqual({ ok: false, code: "WRONG_CURRENT_PASSWORD" });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).sessionVersion).toBe(1);
  });
  it("increments the version when a valid reset token updates the password", async () => {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({ data: {
      userId, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + 60_000),
    } });
    const res = await resetPassword(new NextRequest("http://localhost/api/auth/reset-password", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: "ResetPassword123!" }),
    }));
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.sessionVersion).toBe(2);
    expect(await bcrypt.compare("ResetPassword123!", user.password)).toBe(true);
  });
});
