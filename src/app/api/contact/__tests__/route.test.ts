import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, messageCreate, userFindMany, notificationCreateMany, rateLimitMock, rateLimitEnabledMock } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    messageCreate: vi.fn(),
    userFindMany: vi.fn(),
    notificationCreateMany: vi.fn(),
    rateLimitMock: vi.fn(),
    rateLimitEnabledMock: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        contactMessage: { create: messageCreate },
        user: { findMany: userFindMany },
        notification: { createMany: notificationCreateMany },
      }),
  },
}));
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  rateLimit: rateLimitMock,
  rateLimitEnabled: rateLimitEnabledMock,
}));

import { POST } from "@/app/api/contact/route";

const validBody = {
  name: "Juan Dela Cruz",
  email: "Juan@Gmail.com",
  subject: "Suspended or banned account",
  message: "My account was suspended and I would like to know why.",
};
const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  );

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(null);
    rateLimitEnabledMock.mockReturnValue(false);
    userFindMany.mockResolvedValue([{ id: "admin1" }, { id: "admin2" }]);
    messageCreate.mockResolvedValue({ id: "m1" });
  });

  it("stores a message from a signed-out visitor with no sender", async () => {
    const res = await post(validBody);

    expect(res.status).toBe(201);
    expect(messageCreate).toHaveBeenCalledWith({
      data: {
        name: "Juan Dela Cruz",
        email: "juan@gmail.com",
        subject: "Suspended or banned account",
        message: validBody.message,
        senderId: null,
      },
    });
  });

  it("links the message to the account when the sender is signed in", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });

    await post(validBody);

    expect(messageCreate.mock.calls[0][0].data.senderId).toBe("u1");
  });

  it("notifies every active admin", async () => {
    await post(validBody);

    const rows = notificationCreateMany.mock.calls[0][0].data as { userId: string; type: string; link: string }[];
    expect(rows.map((row) => row.userId)).toEqual(["admin1", "admin2"]);
    expect(rows[0]).toMatchObject({ type: "CONTACT_MESSAGE_NEW", link: "/admin/contact-messages" });
  });

  it.each([
    ["a missing name", { name: "" }],
    ["an invalid email", { email: "asa@qwqe" }],
    ["an unknown subject", { subject: "Free money" }],
    ["a message under 10 characters", { message: "help" }],
    ["a message over the limit", { message: "x".repeat(2001) }],
    ["a filled honeypot", { website: "http://spam.example" }],
  ])("returns 400 for %s", async (_label, override) => {
    const res = await post({ ...validBody, ...override });

    expect(res.status).toBe(400);
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("returns 429 once the sender is over the hourly limit", async () => {
    rateLimitEnabledMock.mockReturnValue(true);
    rateLimitMock.mockReturnValue({ ok: false, retryAfter: 120 });

    const res = await post(validBody);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when the write fails", async () => {
    messageCreate.mockRejectedValue(new Error("db down"));
    expect((await post(validBody)).status).toBe(500);
  });
});
