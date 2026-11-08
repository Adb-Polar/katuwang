import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ find: vi.fn(), claim: vi.fn(), update: vi.fn(), retire: vi.fn(), lock: vi.fn(), user: vi.fn(), hash: vi.fn(async () => "hashed-pw"), transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  passwordResetToken: { findUnique: m.find },
  $transaction: m.transaction,
} }));
vi.mock("bcryptjs", () => ({ default: { hash: m.hash } }));
import { POST } from "../route";
const req = (token = "good", password = "longenough") => new NextRequest("https://example.test/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
const record = () => ({ id: "t", userId: "u", usedAt: null, expiresAt: new Date(Date.now() + 60000) });
describe("reset redemption", () => {
  beforeEach(() => {
    vi.clearAllMocks(); m.find.mockResolvedValue(record()); m.claim.mockResolvedValue({ count: 1 }); m.user.mockResolvedValue({ status: "ACTIVE" });
    m.transaction.mockImplementation(async fn => fn({ $queryRaw: m.lock, user: { findUnique: m.user, update: m.update }, passwordResetToken: { updateMany: m.claim }, recoveryChallenge: { updateMany: m.retire } }));
  });
  it("applies existing password rules", async () => {
    for (const password of ["short", "password123", "x".repeat(73)]) expect((await POST(req("good", password))).status).toBe(400);
    expect(m.update).not.toHaveBeenCalled();
  });
  it.each([null, { ...record(), usedAt: new Date() }, { ...record(), expiresAt: new Date(0) }])("rejects invalid, used and expired tokens: %s", async value => {
    m.find.mockResolvedValue(value); expect((await POST(req())).status).toBe(400); expect(m.update).not.toHaveBeenCalled();
  });
  it("hashes the password, claims atomically and invalidates all outstanding credentials", async () => {
    expect((await POST(req())).status).toBe(200);
    expect(m.lock).toHaveBeenCalled(); expect(m.hash).toHaveBeenCalledWith("longenough", 12);
    expect(m.update).toHaveBeenCalledWith({ where: { id: "u" }, data: { password: "hashed-pw", sessionVersion: { increment: 1 } } });
    expect(m.claim).toHaveBeenCalledWith({ where: { id: "t", usedAt: null, expiresAt: { gt: expect.any(Date) } }, data: { usedAt: expect.any(Date) } });
    expect(m.claim).toHaveBeenCalledWith({ where: { userId: "u", usedAt: null }, data: { usedAt: expect.any(Date) } });
    expect(m.retire).toHaveBeenCalled();
  });
  it("rejects a concurrent claim or reuse without updating the password", async () => {
    m.claim.mockResolvedValue({ count: 0 }); expect((await POST(req())).status).toBe(400); expect(m.update).not.toHaveBeenCalled();
  });
  it("rejects banned accounts", async () => { m.user.mockResolvedValue({ status: "BANNED" }); expect((await POST(req())).status).toBe(400); expect(m.update).not.toHaveBeenCalled(); });
  it("reports transaction failure", async () => { m.transaction.mockRejectedValueOnce(new Error("db down")); expect((await POST(req())).status).toBe(500); });
});
