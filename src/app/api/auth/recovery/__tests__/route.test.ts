import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { hashResetToken } from "@/lib/passwordReset";
const m = vi.hoisted(() => ({ find: vi.fn(), attempt: vi.fn(), update: vi.fn(), user: vi.fn(), claim: vi.fn(), retire: vi.fn(), create: vi.fn(), mail: vi.fn(), lock: vi.fn(), after: [] as (() => Promise<void>)[] }));
vi.mock("next/server", async original => ({ ...await original<typeof import("next/server")>(), after: (fn: () => Promise<void>) => m.after.push(fn) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  recoveryChallenge: { findUnique: m.find, updateMany: m.attempt, update: m.update }, user: { findUnique: m.user },
  $transaction: async (fn: (tx: unknown) => unknown) => fn({ $queryRaw: m.lock, user: { findUnique: m.user }, recoveryChallenge: { updateMany: m.claim }, passwordResetToken: { updateMany: m.retire, create: m.create } }),
} }));
vi.mock("@/lib/mail", () => ({ sendMail: m.mail, renderPasswordResetEmail: (url: string) => ({ text: url }) }));
import { POST } from "../route";
const secret = "a".repeat(64);
const user = { id: "u", email: "primary@example.test", recoveryEmail: "backup@example.test", recoveryEmailVerifiedAt: new Date(), status: "ACTIVE" };
const record = () => ({ id: "c", userId: "u", purpose: "ownership", email: user.email, usedAt: null, verifiedAt: new Date(), codeHash: hashResetToken(secret + "12345678"), expiresAt: new Date(Date.now() + 60000) });
const req = (body: unknown, cookie = secret) => new NextRequest("https://example.test/api/auth/recovery", { method: "POST", headers: { cookie: `kt-recovery=${cookie}` }, body: JSON.stringify(body) });
async function flush() { for (const fn of m.after.splice(0)) await fn(); }
describe("verified recovery choices and sending", () => {
  beforeEach(() => { vi.clearAllMocks(); m.after.length = 0; m.find.mockResolvedValue(record()); m.user.mockResolvedValue(user); m.attempt.mockResolvedValue({ count: 1 }); m.claim.mockResolvedValue({ count: 1 }); });
  it("reveals only masked choices after the correct code", async () => {
    const res = await POST(req({ action: "verify", code: "12345678" }));
    expect(res.status).toBe(200); expect(await res.json()).toEqual({ primary: "p***@example.test", recovery: "b***@example.test" });
    expect(m.update).toHaveBeenCalledWith({ where: { id: "c" }, data: { verifiedAt: expect.any(Date) } });
  });
  it.each([null, { ...user, recoveryEmailVerifiedAt: null }])("omits missing/unverified recovery addresses", async value => {
    m.user.mockResolvedValue(value ?? { ...user, recoveryEmail: null });
    expect((await (await POST(req({ action: "verify", code: "12345678" }))).json()).recovery).toBeNull();
  });
  it("rejects incorrect codes and enforces a persistent five-attempt maximum", async () => {
    expect((await POST(req({ action: "verify", code: "00000000" }))).status).toBe(400);
    expect(m.update).not.toHaveBeenCalled(); m.attempt.mockResolvedValue({ count: 0 });
    expect((await POST(req({ action: "verify", code: "12345678" }))).status).toBe(400);
    expect(m.attempt).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ attempts: { lt: 5 } }) }));
  });
  it.each([null, { ...record(), usedAt: new Date() }, { ...record(), expiresAt: new Date(0) }, { ...record(), purpose: "verify-recovery" }])("rejects invalid challenge %s", async value => {
    m.find.mockResolvedValue(value); expect((await POST(req({ action: "verify", code: "12345678" }))).status).toBe(400);
  });
  it("requires proof before sending, even with a known cookie", async () => {
    m.find.mockResolvedValue({ ...record(), verifiedAt: null }); expect((await POST(req({ action: "send", method: "primary" }))).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });
  it.each(["primary", "recovery"])("sends to the database-selected %s email and stores only a 15-minute token hash", async method => {
    const res = await POST(req({ action: "send", method, email: "attacker@example.test" })); expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Check your selected inbox for a password reset link. The link expires in 15 minutes." });
    expect(m.mail).not.toHaveBeenCalled(); await flush();
    const sent = m.mail.mock.calls[0][0]; expect(sent.to).toBe(method === "primary" ? user.email : user.recoveryEmail);
    const raw = sent.text.split("#token=")[1]; expect(raw).toMatch(/^[a-f0-9]{64}$/);
    const stored = m.create.mock.calls[0][0].data; expect(stored.tokenHash).toBe(hashResetToken(raw)); expect(stored.tokenHash).not.toBe(raw);
    expect(stored.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(900000); expect(m.retire).toHaveBeenCalled();
  });
  it("never delivers to an unverified recovery address", async () => {
    m.user.mockResolvedValue({ ...user, recoveryEmailVerifiedAt: null }); expect((await POST(req({ action: "send", method: "recovery" }))).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });
  it("rechecks verification inside the transaction to catch address changes", async () => {
    m.user.mockResolvedValueOnce(user).mockResolvedValueOnce({ ...user, recoveryEmail: "changed@example.test" });
    expect((await POST(req({ action: "send", method: "recovery" }))).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });
  it("prevents repeated/concurrent issuance from one challenge", async () => {
    m.claim.mockResolvedValue({ count: 0 }); expect((await POST(req({ action: "send", method: "primary" }))).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });
  it("does not allow arbitrary methods or missing cookies", async () => {
    expect((await POST(req({ action: "send", method: "attacker@example.test" }))).status).toBe(400);
    expect((await POST(req({ action: "send", method: "primary" }, ""))).status).toBe(400);
  });
});
