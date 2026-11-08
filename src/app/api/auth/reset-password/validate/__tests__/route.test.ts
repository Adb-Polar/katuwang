import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ find: vi.fn(), enabled: vi.fn(() => false) }));
vi.mock("@/lib/prisma", () => ({ prisma: { passwordResetToken: { findUnique: m.find } } }));
vi.mock("@/lib/rateLimit", async original => ({ ...await original<typeof import("@/lib/rateLimit")>(), rateLimitEnabled: m.enabled }));
import { POST } from "../route";
const req = (token = "a".repeat(64)) => new NextRequest("https://example.test/api/auth/reset-password/validate", { method: "POST", body: JSON.stringify({ token }) });
const valid = () => ({ usedAt: null, expiresAt: new Date(Date.now() + 10000), user: { status: "ACTIVE" } });
describe("reset link validation", () => {
  beforeEach(() => { vi.clearAllMocks(); m.enabled.mockReturnValue(false); m.find.mockResolvedValue(valid()); });
  it("validates an unexpired unused token without returning it", async () => {
    const res = await POST(req()); expect(res.status).toBe(200); expect(await res.json()).toEqual({ valid: true }); expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it.each([null, { ...valid(), usedAt: new Date() }, { ...valid(), expiresAt: new Date(0) }, { ...valid(), user: { status: "BANNED" } }])("rejects invalid records %s", async value => {
    m.find.mockResolvedValue(value); expect((await POST(req())).status).toBe(400);
  });
  it("rejects malformed tokens before lookup", async () => { expect((await POST(req("bad"))).status).toBe(400); expect(m.find).not.toHaveBeenCalled(); });
  it("rate limits token validation", async () => {
    m.enabled.mockReturnValue(true);
    for (let i = 0; i < 10; i++) expect((await POST(req())).status).toBe(200);
    const res = await POST(req()); expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBeTruthy();
  });
});
