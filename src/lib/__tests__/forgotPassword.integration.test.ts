import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as verify } from "@/app/api/auth/recovery/route";
import { POST as validate } from "@/app/api/auth/reset-password/validate/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { RECOVERY_COOKIE, RESET_COOKIE } from "@/lib/recovery";
import { hashResetToken } from "@/lib/passwordReset";

const mocks = vi.hoisted(() => ({ mail: vi.fn(), after: [] as (() => Promise<void>)[] }));
vi.mock("next/server", async original => ({ ...await original<typeof import("next/server")>(), after: (fn: () => Promise<void>) => mocks.after.push(fn) }));
vi.mock("@/lib/mail", async original => ({ ...await original<typeof import("@/lib/mail")>(), sendMail: mocks.mail }));

// Never exercise password resets against application data or a remote database.
describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB OTP-to-password recovery", () => {
  let userId: string;
  let email: string;
  let originalHash: string;
  const oldPassword = "OriginalPassword!2026";
  const newPassword = "NewPassword!2026";
  const request = (body: unknown, cookie = "") => new NextRequest("https://example.test/api/auth/qa", {
    method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body),
  });
  const cookieFrom = (res: NextResponse, name: string) => `${name}=${res.cookies.get(name)!.value}`;
  const provider = authOptions.providers[0] as unknown as { options: { authorize: (credentials: { email: string; password: string }, req: object) => Promise<unknown> } };
  const login = (password: string) => provider.options.authorize({ email, password }, {});
  async function start(method = "primary") {
    const res = await forgot(request({ email, method }));
    expect(res.status).toBe(200);
    for (const fn of mocks.after.splice(0)) await fn();
    const message = mocks.mail.mock.calls.at(-1)![0];
    const code = message.text.match(/\b\d{8}\b/)?.[0];
    if (!code) throw new Error("OTP email missing a code");
    return { cookie: cookieFrom(res, RECOVERY_COOKIE), code, to: message.to };
  }
  const submit = (cookie: string, password = newPassword, confirmPassword = password) => reset(request({ password, confirmPassword }, cookie));

  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw new Error("Use an isolated local verification database.");
    const suffix = randomBytes(8).toString("hex");
    email = `qa-otp-${suffix}@example.test`; originalHash = await bcrypt.hash(oldPassword, 4);
    userId = (await prisma.user.create({ data: {
      anonymousId: `QA-OTP-${suffix}`, email, firstName: "QA", lastName: "OTP", password: originalHash,
      role: "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA", emailVerifiedAt: new Date(),
    } })).id;
  });
  beforeEach(async () => {
    mocks.mail.mockReset(); mocks.mail.mockResolvedValue(undefined); mocks.after.length = 0;
    await prisma.recoveryChallenge.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { password: originalHash, sessionVersion: 0, recoveryEmail: null, recoveryEmailVerifiedAt: null } });
  });
  afterAll(async () => { if (userId) await prisma.user.delete({ where: { id: userId } }); await prisma.$disconnect(); });

  it("sends one OTP email, changes the password directly, and permits only the new password to log in", async () => {
    const otp = await start(); expect(otp.to).toBe(email);
    const verified = await verify(request({ action: "verify", code: otp.code }, otp.cookie));
    expect(verified.status).toBe(200); expect(await verified.json()).toEqual({ verified: true });
    const cookie = cookieFrom(verified, RESET_COOKIE);
    const stored = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId } });
    expect(stored.tokenHash).toBe(hashResetToken(verified.cookies.get(RESET_COOKIE)!.value));
    expect((await validate(request({}, cookie))).status).toBe(200);
    expect((await submit(cookie, newPassword, "DifferentPassword!2026")).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).password).toBe(originalHash);
    const changed = await submit(cookie); expect(changed.status).toBe(200);
    expect(changed.cookies.get(RESET_COOKIE)?.maxAge).toBe(0);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).sessionVersion).toBe(1);
    await expect(login(newPassword)).resolves.toMatchObject({ id: userId });
    await expect(login(oldPassword)).rejects.toThrow("INCORRECT_PASSWORD");
    expect((await submit(cookie, "ReplayPassword!2026")).status).toBe(400);
    expect((await verify(request({ action: "verify", code: otp.code }, otp.cookie))).status).toBe(400);
    expect((await validate(request({}, cookie))).status).toBe(400);
    expect(mocks.after).toHaveLength(0); expect(mocks.mail).toHaveBeenCalledTimes(1);
  });

  it("rejects incorrect, exhausted and expired OTPs without issuing reset authorization", async () => {
    const otp = await start();
    const wrong = otp.code === "00000000" ? "11111111" : "00000000";
    for (let i = 0; i < 5; i++) expect((await verify(request({ action: "verify", code: wrong }, otp.cookie))).status).toBe(400);
    expect((await verify(request({ action: "verify", code: otp.code }, otp.cookie))).status).toBe(400);
    expect((await prisma.recoveryChallenge.findFirstOrThrow({ where: { userId } })).attempts).toBe(5);
    const fresh = await start();
    await prisma.recoveryChallenge.updateMany({ where: { userId }, data: { expiresAt: new Date(0) } });
    expect((await verify(request({ action: "verify", code: fresh.code }, fresh.cookie))).status).toBe(400);
    expect(await prisma.passwordResetToken.count({ where: { userId } })).toBe(0);
  });

  it("requires real OTP authorization and rejects an expired reset cookie", async () => {
    const otp = await start();
    expect((await reset(request({ email, verified: true, password: newPassword }))).status).toBe(400);
    expect((await submit(otp.cookie)).status).toBe(400);
    const verified = await verify(request({ action: "verify", code: otp.code }, otp.cookie));
    const cookie = cookieFrom(verified, RESET_COOKIE);
    await prisma.passwordResetToken.updateMany({ where: { userId }, data: { expiresAt: new Date(0) } });
    expect((await validate(request({}, cookie))).status).toBe(400);
    expect((await submit(cookie)).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).password).toBe(originalHash);
  });

  it("issues only one reset authorization for concurrent verification of the same OTP", async () => {
    const otp = await start();
    const responses = await Promise.all([0, 1, 2].map(() => verify(request({ action: "verify", code: otp.code }, otp.cookie))));
    expect(responses.map(res => res.status).sort()).toEqual([200, 400, 400]);
    expect(await prisma.passwordResetToken.count({ where: { userId } })).toBe(1);
    expect(mocks.mail).toHaveBeenCalledTimes(1);
  });

  it("preserves recovery through a verified backup inbox without a reset-link email", async () => {
    const backup = "qa-backup@example.test";
    await prisma.user.update({ where: { id: userId }, data: { recoveryEmail: backup, recoveryEmailVerifiedAt: new Date() } });
    const otp = await start("recovery"); expect(otp.to).toBe(backup);
    const verified = await verify(request({ action: "verify", code: otp.code }, otp.cookie));
    expect(verified.status).toBe(200);
    expect((await submit(cookieFrom(verified, RESET_COOKIE))).status).toBe(200);
    expect(mocks.after).toHaveLength(0); expect(mocks.mail).toHaveBeenCalledTimes(1);
  });
});
