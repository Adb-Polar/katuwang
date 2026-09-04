import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  appealFindUnique,
  appealUpdate,
  classUpdate,
  auditCreate,
  notificationCreate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  appealFindUnique: vi.fn(),
  appealUpdate: vi.fn(),
  classUpdate: vi.fn(),
  auditCreate: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    classAppeal: { findUnique: appealFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        classAppeal: { update: appealUpdate },
        tutorClass: { update: classUpdate },
        auditLog: { create: auditCreate },
        notification: { create: notificationCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/class-appeals/[appealId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = { params: Promise.resolve({ appealId: "a1" }) };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/class-appeals/a1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const pendingAppeal = {
  id: "a1",
  status: "PENDING",
  classId: "c1",
  tutorProfile: { userId: "tutorU1" },
  class: { code: "C-0001", subject: "MATH" },
};

describe("PATCH /api/admin/class-appeals/[appealId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appealFindUnique.mockResolvedValue(pendingAppeal);
    appealUpdate.mockResolvedValue({ id: "a1", status: "APPROVED" });
  });

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(req({ decision: "APPROVE" }), params);
    expect(res.status).toBe(401);
  });

  it("404 when the appeal is missing", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    appealFindUnique.mockResolvedValue(null);
    const res = await PATCH(req({ decision: "APPROVE" }), params);
    expect(res.status).toBe(404);
  });

  it("400 when the appeal is not pending", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    appealFindUnique.mockResolvedValue({ ...pendingAppeal, status: "APPROVED" });
    const res = await PATCH(req({ decision: "APPROVE" }), params);
    expect(res.status).toBe(400);
  });

  it("400 on an invalid decision", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "MAYBE" }), params);
    expect(res.status).toBe(400);
  });

  it("APPROVE reinstates the class and notifies the tutor", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "APPROVE" }), params);
    expect(res.status).toBe(200);
    expect(appealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewedById: "A1" }) })
    );
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({ status: "SCHEDULED", suspendedReason: null }),
      })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "tutorU1", type: "CLASS_APPEAL_APPROVED" }) })
    );
  });

  it("REJECT records the decision and notifies without touching the class", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "REJECT", reviewNote: "Room double-booked, ban stands." }), params);
    expect(res.status).toBe(200);
    expect(classUpdate).not.toHaveBeenCalled();
    expect(appealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED", reviewNote: "Room double-booked, ban stands." }) })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "tutorU1", type: "CLASS_APPEAL_REJECTED" }) })
    );
  });
});
