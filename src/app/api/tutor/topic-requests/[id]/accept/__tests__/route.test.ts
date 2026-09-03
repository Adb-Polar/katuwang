import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  topicRequestFindUnique,
  topicRequestFindFirst,
  topicCertFindMany,
  classSessionFindMany,
  tutorClassCreate,
  topicRequestUpdate,
  notificationCreate,
  idCounterUpsert,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  topicRequestFindUnique: vi.fn(),
  topicRequestFindFirst: vi.fn(),
  topicCertFindMany: vi.fn(),
  classSessionFindMany: vi.fn(),
  tutorClassCreate: vi.fn(),
  topicRequestUpdate: vi.fn(),
  notificationCreate: vi.fn(),
  idCounterUpsert: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicRequest: { findUnique: topicRequestFindUnique, findFirst: topicRequestFindFirst, update: topicRequestUpdate },
    topicCertification: { findMany: topicCertFindMany },
    classSession: { findMany: classSessionFindMany },
    idCounter: { upsert: idCounterUpsert },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        tutorClass: { create: tutorClassCreate },
        topicRequest: { update: topicRequestUpdate },
        notification: { create: notificationCreate },
      }),
  },
}));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import { POST } from "@/app/api/tutor/topic-requests/[id]/accept/route";

const params = Promise.resolve({ id: "r1" });
const tutor = { user: { id: "T1", role: "STUDENT_TUTOR" } };

const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    subject: "MATH",
    gradeLevel: "GRADE_9",
    topics: ["Algebraic Expressions"],
    maxStudents: 3,
    sessions: [{ topic: "Algebraic Expressions", scheduledAt: futureDate, duration: 60 }],
    ...overrides,
  };
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/topic-requests/r1/accept", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/tutor/topic-requests/[id]/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicRequestFindUnique.mockResolvedValue({ id: "r1", status: "OPEN", subject: "MATH", learnerId: "L1" });
    topicRequestFindFirst.mockResolvedValue({ id: "r1" }); // eligible by default
    topicCertFindMany.mockResolvedValue([{ subject: "MATH", topic: "Algebraic Expressions" }]);
    classSessionFindMany.mockResolvedValue([]);
    idCounterUpsert.mockResolvedValue({ role: "CLASS", count: 1 });
    tutorClassCreate.mockResolvedValue({ id: "c1" });
    topicRequestUpdate.mockResolvedValue({ id: "r1", status: "ACCEPTED", fulfilledClassId: "c1" });
  });

  it("401 for non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(401);
  });

  it("400 when the request is not OPEN", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicRequestFindUnique.mockResolvedValue({ id: "r1", status: "ACCEPTED", subject: "MATH", learnerId: "L1" });
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(400);
    expect(tutorClassCreate).not.toHaveBeenCalled();
  });

  it("403 when the tutor is not eligible for this request (not directed, no matching cert)", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicRequestFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(403);
    expect(tutorClassCreate).not.toHaveBeenCalled();
  });

  it("400 when the submitted subject doesn't match the request's subject", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(makeRequest(validBody({ subject: "SCIENCE" })), { params });
    expect(res.status).toBe(400);
    expect(tutorClassCreate).not.toHaveBeenCalled();
  });

  it("400 when a submitted topic isn't CERTIFIED for this tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicCertFindMany.mockResolvedValue([]); // no certifications at all
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/not certified/i);
    expect(tutorClassCreate).not.toHaveBeenCalled();
  });

  it("400 when a session is scheduled in the past", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(
      makeRequest(
        validBody({
          sessions: [{ topic: "Algebraic Expressions", scheduledAt: new Date(Date.now() - 60000).toISOString(), duration: 60 }],
        })
      ),
      { params }
    );
    expect(res.status).toBe(400);
  });

  it("409 on a time conflict with an existing session", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classSessionFindMany.mockResolvedValue([
      { scheduledAt: new Date(futureDate), duration: 60 },
    ]);
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(409);
    expect(tutorClassCreate).not.toHaveBeenCalled();
  });

  it("happy path: creates the class, marks the request ACCEPTED, notifies the learner, does not enroll anyone", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(makeRequest(validBody()), { params });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.classId).toBe("c1");
    expect(json.request).toEqual({ id: "r1", status: "ACCEPTED", fulfilledClassId: "c1" });

    expect(tutorClassCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tutorProfileId: "tp1", subject: "MATH", published: true, status: "SCHEDULED" }),
      })
    );
    expect(topicRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: { status: "ACCEPTED", fulfilledClassId: "c1" },
      })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "L1", type: "TOPIC_REQUEST_ACCEPTED" }),
      })
    );
  });
});
