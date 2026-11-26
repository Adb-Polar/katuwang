import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  session: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: m.session }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contactMessage: { findMany: m.findMany, count: m.count, findUnique: m.findUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ contactMessage: { update: m.update }, auditLog: { create: m.auditCreate } }),
  },
}));

import { GET } from "@/app/api/admin/contact-messages/route";
import { PATCH } from "@/app/api/admin/contact-messages/[messageId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const get = (query = "") => GET(new NextRequest(`http://localhost/api/admin/contact-messages${query}`));
const patch = (body: unknown) =>
  PATCH(new NextRequest("http://localhost/api/admin/contact-messages/cm1", { method: "PATCH", body: JSON.stringify(body) }), {
    params: Promise.resolve({ messageId: "cm1" }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.session.mockResolvedValue(admin);
  m.findMany.mockResolvedValue([]);
  m.count.mockResolvedValue(0);
  m.findUnique.mockResolvedValue({ id: "cm1", status: "OPEN", category: "ACCOUNT_ACCESS" });
  m.update.mockImplementation(async ({ data }) => ({ id: "cm1", status: data.status, handledAt: data.handledAt }));
});

describe("GET /api/admin/contact-messages", () => {
  it("401 when unauthenticated", async () => {
    m.session.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it.each(["STUDENT_LEARNER", "STUDENT_TUTOR"])("403 for a %s", async (role) => {
    m.session.mockResolvedValue({ user: { id: "x", role } });
    expect((await get()).status).toBe(403);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("lists open messages oldest first, with the open count", async () => {
    m.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
    const res = await get();
    expect(res.status).toBe(200);
    expect(m.findMany.mock.calls[0][0]).toMatchObject({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, skip: 0, take: 10 });
    expect(await res.json()).toMatchObject({ total: 3, openCount: 3, page: 1, pageSize: 10 });
  });

  it("lists handled messages most recently handled first", async () => {
    await get("?status=HANDLED&page=2");
    expect(m.findMany.mock.calls[0][0]).toMatchObject({ where: { status: "HANDLED" }, orderBy: { handledAt: "desc" }, skip: 10 });
  });

  it("falls back to open for an unknown status and caps the page size", async () => {
    await get("?status=DELETED&pageSize=9999");
    expect(m.findMany.mock.calls[0][0]).toMatchObject({ where: { status: "OPEN" }, take: 50 });
  });

  it("is available to the super admin", async () => {
    m.session.mockResolvedValue({ user: { id: "S1", role: "SUPER_ADMIN" } });
    expect((await get()).status).toBe(200);
  });

  it("500 when the database fails", async () => {
    m.findMany.mockRejectedValue(new Error("db down"));
    expect((await get()).status).toBe(500);
  });
});

describe("PATCH /api/admin/contact-messages/[messageId]", () => {
  it("403 for a non-admin", async () => {
    m.session.mockResolvedValue({ user: { id: "x", role: "STUDENT_TUTOR" } });
    expect((await patch({ status: "HANDLED" })).status).toBe(403);
    expect(m.update).not.toHaveBeenCalled();
  });

  it("400 for an invalid status", async () => {
    expect((await patch({ status: "DELETED" })).status).toBe(400);
  });

  it("404 when the message does not exist", async () => {
    m.findUnique.mockResolvedValue(null);
    expect((await patch({ status: "HANDLED" })).status).toBe(404);
  });

  it("marks a message handled, records who and when, and writes an audit row without sender details", async () => {
    const res = await patch({ status: "HANDLED" });
    expect(res.status).toBe(200);
    const { data } = m.update.mock.calls[0][0];
    expect(data).toMatchObject({ status: "HANDLED", handledById: "A1" });
    expect(data.handledAt).toBeInstanceOf(Date);
    expect(m.auditCreate.mock.calls[0][0].data).toEqual({
      adminId: "A1",
      action: "CONTACT_MESSAGE_HANDLED",
      targetType: "CONTACT_MESSAGE",
      targetId: "cm1",
      reason: "I can't sign in to my account",
    });
  });

  it("reopens a handled message and clears who handled it", async () => {
    m.findUnique.mockResolvedValue({ id: "cm1", status: "HANDLED", category: "OTHER" });
    const res = await patch({ status: "OPEN" });
    expect(res.status).toBe(200);
    expect(m.update.mock.calls[0][0].data).toEqual({ status: "OPEN", handledById: null, handledAt: null });
    expect(m.auditCreate.mock.calls[0][0].data.action).toBe("CONTACT_MESSAGE_REOPENED");
  });

  it("409 when the message is already in the requested state", async () => {
    m.findUnique.mockResolvedValue({ id: "cm1", status: "HANDLED", category: "OTHER" });
    expect((await patch({ status: "HANDLED" })).status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
  });

  it("500 when the database fails", async () => {
    m.update.mockRejectedValue(new Error("db down"));
    expect((await patch({ status: "HANDLED" })).status).toBe(500);
  });
});
