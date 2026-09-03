import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  findManyMock,
  countMock,
  createMock,
  getSettingMock,
  userFindFirstMock,
  notificationCreateMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
  getSettingMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  notificationCreateMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicRequest: { findMany: findManyMock, count: countMock, create: createMock },
    user: { findFirst: userFindFirstMock },
    tutorProfile: { findUnique: vi.fn() },
    notification: { create: notificationCreateMock },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        topicRequest: { create: createMock },
        tutorProfile: { findUnique: vi.fn().mockResolvedValue({ userId: "T1" }) },
        notification: { create: notificationCreateMock },
      }),
  },
}));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import { GET, POST } from "@/app/api/learner/topic-requests/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/learner/topic-requests", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const learner = { user: { id: "L1", role: "STUDENT_LEARNER", anonymousId: "STU-0001" } };
const validBody = { subject: "MATH", topics: ["Algebraic Expressions"], gradeLevel: "GRADE_9" };

const dbRow = {
  id: "r1",
  subject: "MATH",
  gradeLevel: "GRADE_9",
  note: null,
  status: "OPEN",
  createdAt: new Date(),
  topics: [{ topic: "Algebraic Expressions" }],
  slots: [],
  directedTutor: null,
  fulfilledClass: null,
};

describe("GET /api/learner/topic-requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "t1", role: "STUDENT_TUTOR" } });
    expect((await GET()).status).toBe(401);
  });

  it("returns only the caller's requests", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findManyMock.mockResolvedValue([dbRow]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: { learnerId: "L1" } }));
    const json = await res.json();
    expect(json[0].topics).toEqual(["Algebraic Expressions"]);
    expect(json[0].directedTo).toBeNull();
  });
});

describe("POST /api/learner/topic-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    countMock.mockResolvedValue(0);
  });

  it("403 when matching disabled", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    getSettingMock.mockResolvedValue(false);
    expect((await POST(makeRequest(validBody))).status).toBe(403);
  });

  it("400 for a topic that doesn't belong to the subject", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(makeRequest({ ...validBody, topics: ["Nonsense"] }));
    expect(res.status).toBe(400);
  });

  it("409 when the learner already has the maximum open requests", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    countMock.mockResolvedValue(10);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates the request and returns 201", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    createMock.mockResolvedValue(dbRow);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ learnerId: "L1", subject: "MATH", gradeLevel: "GRADE_9" }),
      })
    );
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  it("400 when directedTutorId does not resolve to a real tutor", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    userFindFirstMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ ...validBody, directedTutorId: "bad-id" }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("directedTutorId path creates the request and notifies the tutor", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    userFindFirstMock.mockResolvedValue({ tutorProfile: { id: "tp1" } });
    createMock.mockResolvedValue({ ...dbRow, directedTutor: { user: { anonymousId: "TUT-0001" } } });

    const res = await POST(makeRequest({ ...validBody, directedTutorId: "T1" }));
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ directedTutorProfileId: "tp1" }) })
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "T1", type: "TOPIC_REQUEST_DIRECTED" }),
      })
    );
  });
});
