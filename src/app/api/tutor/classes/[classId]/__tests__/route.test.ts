import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  classFindUnique,
  tutorProfileFindUnique,
  classUpdate,
  classFindMany,
  classDelete,
  sessionUpdateMany,
  topicRequestFindMany,
  topicRequestUpdate,
  notificationCreate,
  notificationCreateMany,
  enrollmentFindMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindUnique: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  classUpdate: vi.fn(),
  classFindMany: vi.fn(),
  classDelete: vi.fn(),
  sessionUpdateMany: vi.fn(),
  topicRequestFindMany: vi.fn(),
  topicRequestUpdate: vi.fn(),
  notificationCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  enrollmentFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: classFindUnique, update: classUpdate, findMany: classFindMany },
    tutorProfile: { findUnique: tutorProfileFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        tutorClass: { update: classUpdate, delete: classDelete },
        classSession: { updateMany: sessionUpdateMany },
        classEnrollment: { findMany: enrollmentFindMany },
        topicRequest: { findMany: topicRequestFindMany, update: topicRequestUpdate },
        notification: { create: notificationCreate, createMany: notificationCreateMany },
      }),
  },
}));

import { PATCH, DELETE } from "@/app/api/tutor/classes/[classId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, classId = "c1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ classId }) });
}

describe("PATCH /api/tutor/classes/[classId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionUpdateMany.mockResolvedValue({ count: 0 });
    topicRequestFindMany.mockResolvedValue([]);
    enrollmentFindMany.mockResolvedValue([]);
  });

  it("returns 403 when the class was suspended by an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SUSPENDED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/suspended/i);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 when the class was banned by an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "BANNED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/banned/i);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 when the class belongs to a different tutor (no roster/edit leak)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp-other",
      status: "SCHEDULED",
      _count: { enrollments: 2 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ description: "hijack" });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when reducing capacity below current enrollment count", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 3 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ maxStudents: 2 });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("cascades CANCELLED status to every still-SCHEDULED session in one transaction", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "CANCELLED", topics: [], sessions: [] });

    const res = await patch({ status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: { classId: "c1", status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    });
  });

  it("cascades COMPLETED status to every still-SCHEDULED session in one transaction", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "COMPLETED", topics: [], sessions: [] });

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: { classId: "c1", status: "SCHEDULED" },
      data: { status: "COMPLETED" },
    });
  });

  it("returns 400 when removing a topic still used by a session", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      topics: [{ topic: "Algebraic Expressions" }, { topic: "Fractions & Decimals" }],
      sessions: [{ topic: "Algebraic Expressions" }],
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ subject: "MATH", topics: ["Fractions & Decimals"], maxStudents: 2 });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/currently used by a session/i);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("allows removing a topic that isn't used by any session", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      topics: [{ topic: "Algebraic Expressions" }, { topic: "Fractions & Decimals" }],
      sessions: [{ topic: "Algebraic Expressions" }],
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED", topics: [], sessions: [] });

    const res = await patch({ subject: "MATH", topics: ["Algebraic Expressions"], maxStudents: 2 });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalled();
  });

  it("toggles published", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED", published: false, topics: [], sessions: [] });

    const res = await patch({ published: false });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: false }) })
    );
  });

  it("does not cascade to sessions for non-status updates", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED", topics: [], sessions: [] });

    const res = await patch({ description: "Updated description" });
    expect(res.status).toBe(200);
    expect(sessionUpdateMany).not.toHaveBeenCalled();
  });

  it("COMPLETED cascades linked ACCEPTED/ENROLLED topic requests to FULFILLED and notifies the learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "COMPLETED", topics: [], sessions: [] });
    topicRequestFindMany.mockResolvedValue([{ id: "r1", learnerId: "L1", subject: "MATH" }]);

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(topicRequestUpdate).toHaveBeenCalledWith({ where: { id: "r1" }, data: { status: "FULFILLED" } });
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "L1", type: "TOPIC_REQUEST_FULFILLED" }) })
    );
  });

  it("CANCELLED cascades linked ACCEPTED/ENROLLED topic requests back to OPEN, unlinks, and notifies", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "CANCELLED", topics: [], sessions: [] });
    topicRequestFindMany.mockResolvedValue([{ id: "r1", learnerId: "L1", subject: "MATH" }]);

    const res = await patch({ status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(topicRequestUpdate).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { status: "OPEN", fulfilledClassId: null },
    });
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "L1", type: "TOPIC_REQUEST_REOPENED" }) })
    );
  });

  it("COMPLETED fans CLASS_COMPLETED out to browse-enrolled learners, skipping request-linked ones", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SCHEDULED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    classUpdate.mockResolvedValue({ id: "c1", status: "COMPLETED", code: "C-0001", subject: "MATH", topics: [], sessions: [] });
    topicRequestFindMany.mockResolvedValue([{ id: "r1", learnerId: "L1", subject: "MATH" }]);
    enrollmentFindMany.mockResolvedValue([{ learnerId: "L1" }, { learnerId: "L2" }, { learnerId: "L3" }]);

    const res = await patch({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(notificationCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({ userId: "L2", type: "CLASS_COMPLETED" }),
          expect.objectContaining({ userId: "L3", type: "CLASS_COMPLETED" }),
        ],
      })
    );
  });
});

describe("DELETE /api/tutor/classes/[classId]", () => {
  function del(classId = "c1") {
    return DELETE(new NextRequest("http://localhost/api/tutor/classes/c1", { method: "DELETE" }), {
      params: Promise.resolve({ classId }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    topicRequestFindMany.mockResolvedValue([]);
  });

  it("re-opens a linked ACCEPTED request before deleting the class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", _count: { enrollments: 0 } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicRequestFindMany.mockResolvedValue([{ id: "r1", learnerId: "L1", subject: "MATH" }]);
    classDelete.mockResolvedValue({ id: "c1" });

    const res = await del();
    expect(res.status).toBe(200);
    expect(topicRequestUpdate).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { status: "OPEN", fulfilledClassId: null },
    });
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "L1", type: "TOPIC_REQUEST_REOPENED" }) })
    );
    expect(classDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });
});
