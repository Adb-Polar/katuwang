import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { hashResetToken } from "@/lib/passwordReset";

const mocks = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), mail: vi.fn(), after: [] as (() => Promise<void>)[], enabled: vi.fn(() => false) }));
vi.mock("next/server", async importOriginal => ({ ...await importOriginal<typeof import("next/server")>(), after: (fn: () => Promise<void>) => mocks.after.push(fn) }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.find }, recoveryChallenge: { create: mocks.create } } }));
vi.mock("@/lib/mail", () => ({ sendMail: mocks.mail, renderRecoveryCodeEmail: (code: string) => ({ text: code }) }));
vi.mock("@/lib/rateLimit", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/rateLimit")>(), rateLimitEnabled: mocks.enabled }));
import { POST } from "../route";
const req = (email: string, method?: string) => new NextRequest("https://example.test/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, method }) });
const user = { id: "u", email: "primary@example.test", status: "ACTIVE", recoveryEmail: "backup@example.test", recoveryEmailVerifiedAt: new Date() };
async function flush() { for (const fn of mocks.after.splice(0)) await fn(); }

describe("ownership lookup", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.after.length = 0; mocks.enabled.mockReturnValue(false); mocks.find.mockResolvedValue(user); });
  it("validates email", async () => { expect((await POST(req("bad"))).status).toBe(400); });
  it("responds before lookup or SMTP and only looks up the primary address", async () => {
    const res = await POST(req(user.email));
    expect(res.status).toBe(200); expect(mocks.find).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json(); expect(json).not.toHaveProperty("token"); expect(json).not.toHaveProperty("recovery");
    await flush();
    expect(mocks.find).toHaveBeenCalledWith({ where: { email: user.email } });
    expect(mocks.mail.mock.calls.map(([arg]) => arg.to)).toEqual([user.email]);
    const secret = res.cookies.get("kt-recovery")!.value;
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.tokenHash).toBe(hashResetToken(secret));
    expect(data.codeHash).toBe(hashResetToken(secret + mocks.mail.mock.calls[0][0].text));
    expect(data.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(900000);
  });
  it.each([null, { ...user, recoveryEmailVerifiedAt: null }])("sends only to primary when recovery is absent/unverified: %s", async value => {
    mocks.find.mockResolvedValue(value ? value : { ...user, recoveryEmail: null });
    await POST(req(user.email)); await flush();
    expect(mocks.mail).toHaveBeenCalledTimes(1); expect(mocks.mail.mock.calls[0][0].to).toBe(user.email);
  });
  it("sends only to the verified backup when explicitly selected", async () => {
    const res = await POST(req(user.email, "recovery")); await flush();
    expect(res.status).toBe(200);
    expect(mocks.mail).toHaveBeenCalledTimes(1);
    expect(mocks.mail.mock.calls[0][0].to).toBe(user.recoveryEmail);
  });
  it.each([null, { ...user, recoveryEmailVerifiedAt: null }])("does not fall back or send to absent/unverified backup: %s", async value => {
    mocks.find.mockResolvedValue(value ?? { ...user, recoveryEmail: null });
    const res = await POST(req(user.email, "recovery")); await flush();
    expect(res.status).toBe(200);
    expect(mocks.mail).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects arbitrary delivery methods", async () => {
    expect((await POST(req(user.email, "attacker@example.test"))).status).toBe(400);
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it.each([null, { ...user, status: "BANNED" }])("keeps unknown/banned responses identical: %s", async value => {
    const normal = await POST(req(user.email)); await flush(); vi.clearAllMocks();
    mocks.find.mockResolvedValue(value);
    const other = await POST(req(user.email)); await flush();
    expect(other.status).toBe(normal.status); expect(await other.json()).toEqual(await normal.json());
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.mail).not.toHaveBeenCalled();
  });
  it("contains lookup and transport failures after the public response", async () => {
    mocks.find.mockRejectedValueOnce(new Error("db unavailable"));
    expect((await POST(req(user.email))).status).toBe(200); await flush();
    mocks.mail.mockRejectedValueOnce(new Error("smtp unavailable"));
    expect((await POST(req(user.email))).status).toBe(200); await flush();
  });
  it("rate limits an address regardless of whether it exists", async () => {
    mocks.enabled.mockReturnValue(true);
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      expect((await POST(req("limited@example.test"))).status).toBe(200);
      vi.advanceTimersByTime(60_001);
    }
    const res = await POST(req("limited@example.test")); expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBeTruthy();
    vi.useRealTimers();
  });
});

it("enforces the resend cooldown on the server", async () => {
  mocks.enabled.mockReturnValue(true);
  expect((await POST(req("cooldown@example.test"))).status).toBe(200);
  const res = await POST(req("cooldown@example.test"));
  expect(res.status).toBe(429);
  expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
});

it("allows switching to backup immediately while preserving per-destination cooldown", async () => {
  mocks.enabled.mockReturnValue(true);
  const email = "switch@example.test";
  expect((await POST(req(email, "primary"))).status).toBe(200);
  expect((await POST(req(email, "recovery"))).status).toBe(200);
  expect((await POST(req(email, "recovery"))).status).toBe(429);
});
