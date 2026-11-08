import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { hashResetToken, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { RESET_COOKIE } from "@/lib/recovery";

const m = vi.hoisted(() => ({ find: vi.fn(), attempt: vi.fn(), user: vi.fn(), claim: vi.fn(), retire: vi.fn(), create: vi.fn(), mail: vi.fn(), lock: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  recoveryChallenge: { findUnique: m.find, updateMany: m.attempt }, $transaction: m.transaction,
} }));
vi.mock("@/lib/mail", () => ({ sendMail: m.mail }));
import { POST } from "../route";

const secret = "a".repeat(64);
const user = { id: "u", email: "primary@example.test", status: "ACTIVE" };
const record = () => ({ id: "c", userId: "u", purpose: "ownership", email: user.email, usedAt: null, verifiedAt: null, codeHash: hashResetToken(secret + "12345678"), expiresAt: new Date(Date.now() + 60000) });
const req = (body: unknown = { action: "verify", code: "12345678" }, cookie = secret) => new NextRequest("https://example.test/api/auth/recovery", {
  method: "POST", headers: { cookie: `kt-recovery=${cookie}` }, body: JSON.stringify(body),
});

describe("OTP-authorized password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks(); m.find.mockResolvedValue(record()); m.user.mockResolvedValue(user);
    m.attempt.mockResolvedValue({ count: 1 }); m.claim.mockResolvedValue({ count: 1 });
    m.transaction.mockImplementation(async fn => fn({ $queryRaw: m.lock, user: { findUnique: m.user }, recoveryChallenge: { updateMany: m.claim }, passwordResetToken: { updateMany: m.retire, create: m.create } }));
  });

  it("exchanges a correct OTP for a private, short-lived reset cookie without sending another email", async () => {
    const res = await POST(req());
    expect(res.status).toBe(200); expect(await res.json()).toEqual({ verified: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
    const cookie = res.cookies.get(RESET_COOKIE)!;
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/api/auth/reset-password", maxAge: RESET_TOKEN_TTL_MS / 1000 });
    expect(cookie.value).toMatch(/^[a-f0-9]{64}$/); expect(cookie.value).not.toBe(secret);
    expect(res.cookies.get("kt-recovery")?.maxAge).toBe(0);
    const stored = m.create.mock.calls[0][0].data;
    expect(stored).toMatchObject({ userId: "u", tokenHash: hashResetToken(cookie.value) });
    expect(stored.expiresAt.getTime() - Date.now()).toBeGreaterThan(RESET_TOKEN_TTL_MS - 1000);
    expect(stored.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(RESET_TOKEN_TTL_MS);
    expect(m.lock).toHaveBeenCalled(); expect(m.retire).toHaveBeenCalled();
    expect(m.claim).toHaveBeenCalledWith({ where: { id: "c", usedAt: null, expiresAt: { gt: expect.any(Date) } }, data: { usedAt: expect.any(Date), verifiedAt: expect.any(Date) } });
    expect(m.mail).not.toHaveBeenCalled();
  });

  it("rejects incorrect codes and enforces the persistent five-attempt maximum", async () => {
    expect((await POST(req({ action: "verify", code: "00000000" }))).status).toBe(400);
    expect(m.transaction).not.toHaveBeenCalled(); m.attempt.mockResolvedValue({ count: 0 });
    expect((await POST(req())).status).toBe(400);
    expect(m.attempt).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ attempts: { lt: 5 } }) }));
    expect(m.create).not.toHaveBeenCalled();
  });

  it.each([null, { ...record(), usedAt: new Date() }, { ...record(), expiresAt: new Date(0) }, { ...record(), purpose: "verify-recovery" }])("rejects missing, used, expired and wrong-purpose challenges: %s", async value => {
    m.find.mockResolvedValue(value);
    const res = await POST(req()); expect(res.status).toBe(400);
    expect(res.cookies.get(RESET_COOKIE)).toBeUndefined(); expect(m.create).not.toHaveBeenCalled();
  });

  it.each([null, { ...user, status: "BANNED" }, { ...user, email: "changed@example.test" }])("rechecks the account under lock: %s", async value => {
    m.user.mockResolvedValue(value); expect((await POST(req())).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });

  it("prevents repeated/concurrent issuance or expiry between checking and consumption", async () => {
    m.claim.mockResolvedValue({ count: 0 });
    const res = await POST(req()); expect(res.status).toBe(400);
    expect(res.cookies.get(RESET_COOKIE)).toBeUndefined(); expect(m.create).not.toHaveBeenCalled();
  });

  it.each([{ action: "send", method: "primary" }, { action: "send", method: "recovery" }, { action: "verify", code: "123" }, { email: user.email }])("rejects the removed send action and malformed requests: %s", async body => {
    expect((await POST(req(body))).status).toBe(400); expect(m.create).not.toHaveBeenCalled(); expect(m.mail).not.toHaveBeenCalled();
  });

  it("requires the challenge cookie as well as the OTP", async () => {
    expect((await POST(req(undefined, ""))).status).toBe(400); expect(m.find).not.toHaveBeenCalled();
  });
});
