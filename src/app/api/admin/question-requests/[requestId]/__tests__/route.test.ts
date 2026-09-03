import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findUniqueMock, updateMock, auditLogCreate, notificationCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  auditLogCreate: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionRequest: { findUnique: findUniqueMock, update: updateMock },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        questionRequest: { update: updateMock },
        auditLog: { create: auditLogCreate },
        notification: { create: notificationCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/question-requests/[requestId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = (requestId = "r1") => ({ params: Promise.resolve({ requestId }) });

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/question-requests/r1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/admin/question-requests/[requestId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await PATCH(req({ status: "RESOLVED" }), params());
    expect(res.status).toBe(401);
  });

  it("404 when the request does not exist", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(req({ status: "RESOLVED" }), params());
    expect(res.status).toBe(404);
  });

  it("400 when the request is not open", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "RESOLVED", subject: "MATH", topic: "Trigonometry" });
    const res = await PATCH(req({ status: "DISMISSED" }), params());
    expect(res.status).toBe(400);
  });

  it("400 for an invalid decision", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "OPEN", subject: "MATH", topic: "Trigonometry" });
    const res = await PATCH(req({ status: "MAYBE" }), params());
    expect(res.status).toBe(400);
  });

  it("resolves an open request, stamps the admin, and audits it", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "OPEN", subject: "MATH", topic: "Trigonometry", tutorProfile: { userId: "tutorU1" } });
    updateMock.mockResolvedValue({ id: "r1", status: "RESOLVED" });

    const res = await PATCH(req({ status: "RESOLVED", resolutionNote: "added 6 questions" }), params());
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: expect.objectContaining({
          status: "RESOLVED",
          resolvedById: "A1",
          resolutionNote: "added 6 questions",
        }),
      })
    );
    expect(updateMock.mock.calls[0][0].data.resolvedAt).toBeInstanceOf(Date);
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "QUESTION_REQUEST_RESOLVED", targetType: "QUESTION_REQUEST" }),
      })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "tutorU1", type: "QUESTION_REQUEST_RESOLVED" }) })
    );
  });

  it("notifies the tutor with QUESTION_REQUEST_DISMISSED on a dismissal", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "OPEN", subject: "MATH", topic: "Trigonometry", tutorProfile: { userId: "tutorU1" } });
    updateMock.mockResolvedValue({ id: "r1", status: "DISMISSED" });

    const res = await PATCH(req({ status: "DISMISSED", resolutionNote: "not enough demand" }), params());
    expect(res.status).toBe(200);
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "tutorU1", type: "QUESTION_REQUEST_DISMISSED" }) })
    );
  });
});
