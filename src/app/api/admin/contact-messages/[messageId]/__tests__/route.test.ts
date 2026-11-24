import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, messageFindUnique, messageUpdate, auditCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  messageFindUnique: vi.fn(),
  messageUpdate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contactMessage: { findUnique: messageFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ contactMessage: { update: messageUpdate }, auditLog: { create: auditCreate } }),
  },
}));

import { PATCH } from "@/app/api/admin/contact-messages/[messageId]/route";

const patch = (body: unknown) =>
  PATCH(
    new NextRequest("http://localhost/api/admin/contact-messages/m1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ messageId: "m1" }) }
  );

describe("PATCH /api/admin/contact-messages/[messageId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    messageFindUnique.mockResolvedValue({ status: "OPEN" });
    messageUpdate.mockResolvedValue({ id: "m1", status: "RESOLVED" });
  });

  it("returns 401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    expect((await patch({ status: "RESOLVED" })).status).toBe(401);
  });

  it("returns 400 for an invalid status", async () => {
    expect((await patch({ status: "DELETED" })).status).toBe(400);
  });

  it("returns 404 when the message does not exist", async () => {
    messageFindUnique.mockResolvedValue(null);
    expect((await patch({ status: "RESOLVED" })).status).toBe(404);
  });

  it("returns 409 when the message is already in that status", async () => {
    messageFindUnique.mockResolvedValue({ status: "RESOLVED" });
    expect((await patch({ status: "RESOLVED" })).status).toBe(409);
    expect(messageUpdate).not.toHaveBeenCalled();
  });

  it("resolves a message, recording who did it and an audit entry", async () => {
    const res = await patch({ status: "RESOLVED", adminNote: "Replied by email." });

    expect(res.status).toBe(200);
    expect(messageUpdate.mock.calls[0][0].data).toMatchObject({
      status: "RESOLVED",
      adminNote: "Replied by email.",
      resolvedById: "a1",
    });
    expect(auditCreate.mock.calls[0][0].data).toMatchObject({
      adminId: "a1",
      action: "CONTACT_MESSAGE_RESOLVED",
      targetType: "CONTACT_MESSAGE",
      targetId: "m1",
    });
  });

  it("clears the resolver when a message is re-opened", async () => {
    messageFindUnique.mockResolvedValue({ status: "RESOLVED" });

    await patch({ status: "OPEN" });

    expect(messageUpdate.mock.calls[0][0].data).toMatchObject({ status: "OPEN", resolvedById: null, resolvedAt: null });
    expect(auditCreate.mock.calls[0][0].data.action).toBe("CONTACT_MESSAGE_REOPENED");
  });

  it("returns 500 when the update fails", async () => {
    messageUpdate.mockRejectedValue(new Error("db down"));
    expect((await patch({ status: "RESOLVED" })).status).toBe(500);
  });
});
