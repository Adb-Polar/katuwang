import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  classFindUnique,
  sessionFindMany,
  sessionUpdate,
  sessionDelete,
  sessionTestFindUnique,
  classEnrollmentFindMany,
  notificationCreateMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  classFindUnique: vi.fn(),
  sessionFindMany: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionDelete: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
  notificationCreateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: classFindUnique },
    classSession: { findMany: sessionFindMany, update: sessionUpdate, delete: sessionDelete },
    sessionTest: { findUnique: sessionTestFindUnique },
    classEnrollment: { findMany: classEnrollmentFindMany },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        classSession: { update: sessionUpdate },
        sessionTest: { findUnique: sessionTestFindUnique },
        classEnrollment: { findMany: classEnrollmentFindMany },
        notification: { createMany: notificationCreateMany },
      }),
  },
}));

import { PATCH, DELETE } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/route";

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, classId = "c1", sessionId = "s1") {
  return PATCH(makePatchRequest(body), { params: Promise.resolve({ classId, sessionId }) });
}

function del(classId = "c1", sessionId = "s1") {
  return DELETE(new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1", { method: "DELETE" }), {
    params: Promise.resolve({ classId, sessionId }),
  });
}

const targetSession = {
  id: "s1",
  classId: "c1",
  topic: "Algebraic Expressions",
  scheduledAt: new Date(Date.now() + 86_400_000),
  duration: 60,
  status: "SCHEDULED",
};

function makeClass(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    topics: [{ topic: "Algebraic Expressions" }, { topic: "Fractions & Decimals" }],
    sessions: [targetSession],
    _count: { enrollments: 0 },
    ...overrides,
  };
}

describe("PATCH /api/tutor/classes/[classId]/sessions/[sessionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindMany.mockResolvedValue([]);
    sessionTestFindUnique.mockResolvedValue(null);
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await patch({ topic: "Fractions & Decimals" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(null);
    const res = await patch({ topic: "Fractions & Decimals" });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the session isn't part of this class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ sessions: [] }));
    const res = await patch({ topic: "Fractions & Decimals" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when the tutor doesn't own the class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ tutorProfileId: "other-tp" }));
    const res = await patch({ topic: "Fractions & Decimals" });
    expect(res.status).toBe(403);
  });

  it("returns 403 when the class is banned", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ status: "BANNED" }));
    const res = await patch({ topic: "Fractions & Decimals" });
    expect(res.status).toBe(403);
  });

  it("returns 400 for an invalid topic", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    const res = await patch({ topic: "Not In Class" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when rescheduling into the past", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    const res = await patch({ scheduledAt: new Date(Date.now() - 3600_000).toISOString() });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid status value", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    const res = await patch({ status: "NOT_A_STATUS" });
    expect(res.status).toBe(400);
  });

  it("returns 409 when rescheduling overlaps another session", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionFindMany.mockResolvedValue([{ scheduledAt: new Date(Date.now() + 172_800_000), duration: 60 }]);
    const res = await patch({ scheduledAt: new Date(Date.now() + 172_800_000).toISOString() });
    expect(res.status).toBe(409);
    expect(sessionUpdate).not.toHaveBeenCalled();
  });

  it("reschedules successfully, excluding itself from the overlap check", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionUpdate.mockResolvedValue({ ...targetSession, duration: 90 });

    const res = await patch({ duration: 90 });
    expect(res.status).toBe(200);
    expect(sessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: "s1" } }) })
    );
  });

  it("changes status to COMPLETED without requiring an overlap check", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionUpdate.mockResolvedValue({ ...targetSession, status: "COMPLETED" });

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(sessionFindMany).not.toHaveBeenCalled();
  });

  it("SCHEDULED -> COMPLETED with a PUBLISHED session test notifies every enrolled learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionUpdate.mockResolvedValue({ ...targetSession, status: "COMPLETED", topic: targetSession.topic });
    sessionTestFindUnique.mockResolvedValue({ status: "PUBLISHED" });
    classEnrollmentFindMany.mockResolvedValue([{ learnerId: "L1" }, { learnerId: "L2" }]);

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: "L1", type: "SESSION_POSTTEST_OPEN", message: expect.any(String), link: expect.any(String) },
        { userId: "L2", type: "SESSION_POSTTEST_OPEN", message: expect.any(String), link: expect.any(String) },
      ],
    });
  });

  it("SCHEDULED -> COMPLETED with no test (or a DRAFT one) sends no post-test notification", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionUpdate.mockResolvedValue({ ...targetSession, status: "COMPLETED" });
    sessionTestFindUnique.mockResolvedValue({ status: "DRAFT" });

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(notificationCreateMany).not.toHaveBeenCalled();
  });

  it("changes status to CANCELLED", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass());
    sessionUpdate.mockResolvedValue({ ...targetSession, status: "CANCELLED" });

    const res = await patch({ status: "CANCELLED" });
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/tutor/classes/[classId]/sessions/[sessionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await del();
    expect(res.status).toBe(401);
  });

  it("returns 404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(null);
    const res = await del();
    expect(res.status).toBe(404);
  });

  it("returns 403 when the tutor doesn't own the class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ tutorProfileId: "other-tp" }));
    const res = await del();
    expect(res.status).toBe(403);
  });

  it("returns 400 when the session isn't SCHEDULED", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ sessions: [{ ...targetSession, status: "COMPLETED" }] }));
    const res = await del();
    expect(res.status).toBe(400);
    expect(sessionDelete).not.toHaveBeenCalled();
  });

  it("returns 400 when deleting the last session of a class with enrollments", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ _count: { enrollments: 2 } }));
    const res = await del();
    expect(res.status).toBe(400);
    expect(sessionDelete).not.toHaveBeenCalled();
  });

  it("allows deleting the last session when there are no enrollments", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(makeClass({ _count: { enrollments: 0 } }));
    sessionDelete.mockResolvedValue(targetSession);

    const res = await del();
    expect(res.status).toBe(200);
    expect(sessionDelete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });

  it("allows deleting a non-last session even with enrollments", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classFindUnique.mockResolvedValue(
      makeClass({
        sessions: [targetSession, { ...targetSession, id: "s2" }],
        _count: { enrollments: 2 },
      })
    );
    sessionDelete.mockResolvedValue(targetSession);

    const res = await del();
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await del();
    expect(res.status).toBe(500);
  });
});
