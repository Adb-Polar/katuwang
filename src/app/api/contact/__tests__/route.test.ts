import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  create: vi.fn(),
  adminsFindMany: vi.fn(),
  notifyMany: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitEnabled: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({ notifyMany: m.notifyMany }));
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  rateLimit: m.rateLimit,
  rateLimitEnabled: m.rateLimitEnabled,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ contactMessage: { create: m.create }, user: { findMany: m.adminsFindMany } }),
  },
}));

import { POST } from "@/app/api/contact/route";

const valid = {
  name: "juan dela cruz",
  email: " Juan@Example.com ",
  category: "SUSPENSION_OR_BAN",
  message: "My account was suspended yesterday and I do not know why.",
};
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new NextRequest("http://localhost/api/contact", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.rateLimitEnabled.mockReturnValue(false);
  m.rateLimit.mockReturnValue({ ok: true, retryAfter: 0 });
  m.create.mockResolvedValue({ id: "cm1" });
  m.adminsFindMany.mockResolvedValue([{ id: "admin1" }, { id: "super1" }]);
});

describe("POST /api/contact", () => {
  it("201 saves a message from a signed-out visitor and notifies the admins", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(m.create.mock.calls[0][0].data).toEqual({
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      category: "SUSPENSION_OR_BAN",
      message: valid.message,
    });
    expect(m.notifyMany).toHaveBeenCalledWith(
      expect.anything(), ["admin1", "super1"], "CONTACT_MESSAGE_NEW", expect.any(String), "/admin/contact-messages"
    );
  });

  it("keeps the sender's name, email and message out of the notification", async () => {
    await post(valid);
    const text = m.notifyMany.mock.calls[0][3] as string;
    expect(text).not.toMatch(/juan|example\.com|suspended yesterday/i);
  });

  it("accepts an address outside any sign-up domain allowlist", async () => {
    expect((await post({ ...valid, email: "someone@anywhere.org" })).status).toBe(201);
  });

  it.each([
    ["a missing name", { ...valid, name: "  " }],
    ["a malformed email", { ...valid, email: "asa@qwqe" }],
    ["an unknown category", { ...valid, category: "BILLING" }],
    ["a message of 19 characters", { ...valid, message: "x".repeat(19) }],
    ["a message of 2001 characters", { ...valid, message: "x".repeat(2001) }],
    ["a body that is not JSON", "not json"],
  ])("400 for %s", async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("accepts messages of exactly 20 and 2000 characters", async () => {
    expect((await post({ ...valid, message: "x".repeat(20) })).status).toBe(201);
    expect((await post({ ...valid, message: "x".repeat(2000) })).status).toBe(201);
  });

  it("names the failing field so the form can mark it", async () => {
    const json = await (await post({ ...valid, message: "too short" })).json();
    expect(json.fieldErrors).toEqual([expect.objectContaining({ path: ["message"] })]);
  });

  it("429 with Retry-After once the sender's address is over the limit", async () => {
    m.rateLimitEnabled.mockReturnValue(true);
    m.rateLimit.mockReturnValue({ ok: false, retryAfter: 120 });
    const res = await post(valid, { "x-forwarded-for": "203.0.113.9" });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(m.rateLimit).toHaveBeenCalledWith("contact:ip:203.0.113.9", 5, 60 * 60 * 1000);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("500 when the database fails", async () => {
    m.create.mockRejectedValue(new Error("db down"));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("An unexpected error occurred. Please try again.");
  });
});
