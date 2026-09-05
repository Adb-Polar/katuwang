import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classSessionFindUnique,
  sessionTestFindUnique,
  assessmentQuestionFindMany,
  sessionTestQuestionDeleteMany,
  sessionTestQuestionCreateMany,
  sessionTestFindUniqueOrThrow,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classSessionFindUnique: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  assessmentQuestionFindMany: vi.fn(),
  sessionTestQuestionDeleteMany: vi.fn(),
  sessionTestQuestionCreateMany: vi.fn(),
  sessionTestFindUniqueOrThrow: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique },
    assessmentQuestion: { findMany: assessmentQuestionFindMany },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        sessionTestQuestion: { deleteMany: sessionTestQuestionDeleteMany, createMany: sessionTestQuestionCreateMany },
        sessionTest: { findUniqueOrThrow: sessionTestFindUniqueOrThrow },
      }),
  },
}));

import { PUT } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1" }) });

function put(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1/test/questions", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Fractions" }],
  });
  classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "SCHEDULED" });
  sessionTestFindUnique.mockResolvedValue({
    id: "st1",
    status: "DRAFT",
    questions: [],
    _count: { attempts: 0 },
  });
  assessmentQuestionFindMany.mockResolvedValue([{ id: "q1" }, { id: "q2" }]);
  sessionTestFindUniqueOrThrow.mockResolvedValue({
    id: "st1",
    sessionId: "s1",
    title: "t",
    instructions: null,
    status: "DRAFT",
    publishedAt: null,
    closedAt: null,
    questions: [],
  });
});

describe("PUT /test/questions", () => {
  it("409 once the test is published", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "PUBLISHED", questions: [], _count: { attempts: 0 } });
    const res = await PUT(put({ questionIds: ["q1"] }), ctx());
    expect(res.status).toBe(409);
  });

  it("409 once the test has any attempt, even if still DRAFT", async () => {
    sessionTestFindUnique.mockResolvedValue({ id: "st1", status: "DRAFT", questions: [], _count: { attempts: 1 } });
    const res = await PUT(put({ questionIds: ["q1"] }), ctx());
    expect(res.status).toBe(409);
  });

  it("400 on a duplicate question id", async () => {
    const res = await PUT(put({ questionIds: ["q1", "q1"] }), ctx());
    expect(res.status).toBe(400);
  });

  it("400 when a question is not BANK-of-this-subject or TUTOR-owned", async () => {
    assessmentQuestionFindMany.mockResolvedValue([{ id: "q1" }]); // only 1 of 2 allowed
    const res = await PUT(put({ questionIds: ["q1", "q2"] }), ctx());
    expect(res.status).toBe(400);
    expect(sessionTestQuestionCreateMany).not.toHaveBeenCalled();
  });

  it("replaces the ordered question set and asks for BANK-of-subject OR owned-TUTOR questions", async () => {
    const res = await PUT(put({ questionIds: ["q1", "q2"] }), ctx());
    expect(res.status).toBe(200);
    expect(assessmentQuestionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { origin: "BANK", active: true, subject: "MATH" },
            { origin: "TUTOR", ownerTutorProfileId: "tp1" },
          ],
        }),
      }),
    );
    expect(sessionTestQuestionDeleteMany).toHaveBeenCalledWith({ where: { sessionTestId: "st1" } });
    expect(sessionTestQuestionCreateMany).toHaveBeenCalledWith({
      data: [
        { sessionTestId: "st1", questionId: "q1", position: 0 },
        { sessionTestId: "st1", questionId: "q2", position: 1 },
      ],
    });
  });
});
