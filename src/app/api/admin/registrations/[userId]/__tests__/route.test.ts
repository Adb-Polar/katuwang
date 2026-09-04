import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findUniqueMock, updateMock, auditCreateMock, notificationCreateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  auditCreateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        user: { update: updateMock },
        auditLog: { create: auditCreateMock },
        notification: { create: notificationCreateMock },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/registrations/[userId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = Promise.resolve({ userId: "U1" });

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/registrations/U1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/admin/registrations/[userId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U9", role: "STUDENT_TUTOR" } });
    const res = await PATCH(makeRequest({ decision: "APPROVE" }), { params });
    expect(res.status).toBe(401);
  });

  it("404 when the user does not exist", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ decision: "APPROVE" }), { params });
    expect(res.status).toBe(404);
  });

  it("400 when the account is not PENDING", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "U1", status: "ACTIVE" });
    const res = await PATCH(makeRequest({ decision: "APPROVE" }), { params });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 on an invalid decision", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "U1", status: "PENDING" });
    const res = await PATCH(makeRequest({ decision: "MAYBE" }), { params });
    expect(res.status).toBe(400);
  });

  it("approves -> ACTIVE + USER_APPROVED audit entry", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "U1", status: "PENDING" });
    updateMock.mockResolvedValue({ id: "U1", anonymousId: "STU-0005", status: "ACTIVE", statusReason: null });

    const res = await PATCH(makeRequest({ decision: "APPROVE" }), { params });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "U1" }, data: expect.objectContaining({ status: "ACTIVE" }) })
    );
    expect(auditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "USER_APPROVED", targetType: "USER", targetId: "U1" }) })
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "U1", type: "REGISTRATION_APPROVED" }) })
    );
  });

  it("declines -> DECLINED with the reason + USER_DECLINED audit entry", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "U1", status: "PENDING" });
    updateMock.mockResolvedValue({ id: "U1", anonymousId: "STU-0005", status: "DECLINED", statusReason: "Not a real student" });

    const res = await PATCH(makeRequest({ decision: "DECLINE", reason: "Not a real student" }), { params });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DECLINED", statusReason: "Not a real student" }) })
    );
    expect(auditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "USER_DECLINED", reason: "Not a real student" }) })
    );
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  it("500 when the update throws", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "U1", status: "PENDING" });
    updateMock.mockRejectedValue(new Error("db down"));
    const res = await PATCH(makeRequest({ decision: "APPROVE" }), { params });
    expect(res.status).toBe(500);
  });
});
