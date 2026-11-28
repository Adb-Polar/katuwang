import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  classFindUnique,
  userFindFirst,
  recommendationFindUnique,
  recommendationFindMany,
  recommendationCreate,
  notificationCreate,
  transactionMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  recommendationFindUnique: vi.fn(),
  recommendationFindMany: vi.fn(),
  recommendationCreate: vi.fn(),
  notificationCreate: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: classFindUnique },
    user: { findFirst: userFindFirst },
    classRecommendation: { findUnique: recommendationFindUnique, findMany: recommendationFindMany },
    $transaction: transactionMock,
  },
}));

import { GET, POST } from "@/app/api/admin/classes/[classId]/recommendations/route";

function makeRequest(body?: unknown) {
  return new NextRequest("http://localhost/api/admin/classes/c1/recommendations", {
    method: body ? "POST" : "GET",
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { "content-type": "application/json" },
  });
}

function post(body: unknown, classId = "c1") {
  return POST(makeRequest(body), { params: Promise.resolve({ classId }) });
}

function get(classId = "c1") {
  return GET(makeRequest(), { params: Promise.resolve({ classId }) });
}

describe("POST /api/admin/classes/[classId]/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (cb) =>
      cb({
        classRecommendation: { create: recommendationCreate },
        notification: { create: notificationCreate },
      })
    );
  });

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(401);
  });

  it("401 when the session role is not ADMIN", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "STUDENT_TUTOR" } });
    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(401);
  });

  it("404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue(null);
    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(404);
  });

  it("400 on invalid body", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", subject: "MATH", code: "C-0001" });
    const res = await post({ learnerId: "" });
    expect(res.status).toBe(400);
    expect(userFindFirst).not.toHaveBeenCalled();
  });

  it("404 when the learner doesn't exist or isn't a learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", subject: "MATH", code: "C-0001" });
    userFindFirst.mockResolvedValue(null);
    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(404);
  });

  it("409 when already recommended to that learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", subject: "MATH", code: "C-0001" });
    userFindFirst.mockResolvedValue({ id: "L1" });
    recommendationFindUnique.mockResolvedValue({ id: "existing" });

    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(409);
    expect(recommendationCreate).not.toHaveBeenCalled();
  });

  it("creates the recommendation and notifies the learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      subject: "MATH",
      code: "C-0001",
      gradeLevel: "GRADE_9",
      tutorProfile: { user: { anonymousId: "TUT-0002" } },
      topics: [{ topic: "Fractions" }],
      sessions: [],
    });
    userFindFirst.mockResolvedValue({ id: "L1" });
    recommendationFindUnique.mockResolvedValue(null);
    recommendationCreate.mockResolvedValue({ id: "R1", classId: "c1", learnerId: "L1" });

    const res = await post({ learnerId: "L1", note: "Good fit" });
    expect(res.status).toBe(201);
    expect(recommendationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { classId: "c1", learnerId: "L1", adminId: "A1", note: "Good fit" },
      })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: "L1",
          type: "CLASS_RECOMMENDED_BY_ADMIN",
          message:
            "An administrator recommended the MATH class (C-0001) for you — Grade 9, tutor TUT-0002, topics: Fractions. No upcoming session is scheduled yet.",
          link: "/learner/classes/c1",
        },
      })
    );
    // The admin's note stays among admins.
    expect(notificationCreate.mock.calls[0][0].data.message).not.toContain("Good fit");
    // Only the next upcoming scheduled session is fetched for the message.
    expect(classFindUnique.mock.calls[0][0].select.sessions).toMatchObject({ where: { status: "SCHEDULED" }, take: 1 });
  });

  it("500 when the lookup throws", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    classFindUnique.mockRejectedValue(new Error("db down"));
    const res = await post({ learnerId: "L1" });
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/classes/[classId]/recommendations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(401);
  });

  it("lists recommendations for the class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    recommendationFindMany.mockResolvedValue([{ id: "R1" }]);
    const res = await get();
    expect(res.status).toBe(200);
    expect((await res.json()).recommendations).toEqual([{ id: "R1" }]);
  });
});
