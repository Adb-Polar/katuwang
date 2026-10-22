import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findUniqueMock, findUniqueOrThrowMock, updateMock, historyCreate, auditLogCreate, notificationCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  findUniqueOrThrowMock: vi.fn(),
  updateMock: vi.fn(),
  historyCreate: vi.fn(),
  auditLogCreate: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicRequest: { findUnique: findUniqueMock, update: updateMock },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        topicRequest: { findUniqueOrThrow: findUniqueOrThrowMock, update: updateMock },
        topicRequestHistory: { create: historyCreate },
        auditLog: { create: auditLogCreate },
        notification: { create: notificationCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/topic-requests/[id]/route";

const params = Promise.resolve({ id: "r1" });
const admin = { user: { id: "A1", role: "ADMIN" } };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/topic-requests/r1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/admin/topic-requests/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue({ id: "r1", status: "OPEN", learnerId: "L1", subject: "MATH" });
    updateMock.mockResolvedValue({ id: "r1", status: "CANCELLED" });
    findUniqueOrThrowMock.mockImplementation(async () => ({
      ...(updateMock.mock.calls.length
        ? await updateMock.mock.results.at(-1)?.value
        : await findUniqueMock.mock.results.at(-1)?.value),
      learnerId: "L1", subject: "MATH", topics: [], slots: [],
    }));
  });

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "t1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(401);
  });

  it("404 when the request doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(404);
  });

  it("400 for an invalid status value", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(makeRequest({ status: "ENROLLED" }), { params });
    expect(res.status).toBe(400);
  });

  it("400 when closing an already-terminal request", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "FULFILLED", learnerId: "L1", subject: "MATH" });
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 when re-opening a request that isn't CANCELLED or ACCEPTED", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "OPEN", learnerId: "L1", subject: "MATH" });
    const res = await PATCH(makeRequest({ status: "OPEN" }), { params });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("closes an open request, nulls fulfilledClassId, and writes an audit log entry", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(makeRequest({ status: "CANCELLED", reason: "policy violation" }), { params });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: { status: "CANCELLED", fulfilledClassId: null },
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "A1",
          action: "TOPIC_REQUEST_STATUS_CHANGE",
          targetType: "TOPIC_REQUEST",
          targetId: "r1",
          reason: "policy violation",
        }),
      })
    );
    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: "r1", actorId: "A1", eventType: "STATUS_CHANGED",
        before: expect.objectContaining({ status: "OPEN" }),
        after: expect.objectContaining({ status: "CANCELLED" }),
      }),
    });
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "L1" }) })
    );
  });

  it("re-opens a cancelled request", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "CANCELLED", learnerId: "L1", subject: "MATH" });
    updateMock.mockResolvedValue({ id: "r1", status: "OPEN" });
    const res = await PATCH(makeRequest({ status: "OPEN" }), { params });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: expect.objectContaining({
          status: "OPEN", fulfilledClassId: null,
          lastSubmittedAt: expect.any(Date), expiresAt: expect.any(Date),
        }),
      })
    );
  });

  it("re-opens an accepted request", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findUniqueMock.mockResolvedValue({ id: "r1", status: "ACCEPTED", learnerId: "L1", subject: "MATH" });
    updateMock.mockResolvedValue({ id: "r1", status: "OPEN" });
    const res = await PATCH(makeRequest({ status: "OPEN" }), { params });
    expect(res.status).toBe(200);
  });
});
