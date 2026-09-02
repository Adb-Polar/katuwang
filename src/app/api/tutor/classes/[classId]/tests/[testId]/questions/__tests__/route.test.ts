import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  tutorClassFindUnique,
  classTestFindUnique,
  classTestFindUniqueOrThrow,
  assessmentQuestionFindMany,
  ctqDeleteMany,
  ctqCreateMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  classTestFindUnique: vi.fn(),
  classTestFindUniqueOrThrow: vi.fn(),
  assessmentQuestionFindMany: vi.fn(),
  ctqDeleteMany: vi.fn(),
  ctqCreateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classTest: { findUnique: classTestFindUnique, findUniqueOrThrow: classTestFindUniqueOrThrow },
    assessmentQuestion: { findMany: assessmentQuestionFindMany },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        classTestQuestion: { deleteMany: ctqDeleteMany, createMany: ctqCreateMany },
        classTest: { findUniqueOrThrow: classTestFindUniqueOrThrow },
      }),
  },
}));

import { PUT } from "@/app/api/tutor/classes/[classId]/tests/[testId]/questions/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", testId: "t1" }) });

function put(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/tests/t1/questions", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({
    id: "c1",
    tutorProfileId: "tp1",
    status: "SCHEDULED",
    subject: "MATH",
    topics: [{ topic: "Algebraic Expressions" }],
  });
  classTestFindUnique.mockResolvedValue({ id: "t1", classId: "c1", status: "DRAFT", questions: [] });
  classTestFindUniqueOrThrow.mockResolvedValue({ id: "t1", questions: [] });
});

describe("PUT /api/tutor/classes/[classId]/tests/[testId]/questions", () => {
  it("409 when the test is already published", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classTestFindUnique.mockResolvedValue({ id: "t1", classId: "c1", status: "PUBLISHED", questions: [] });
    const res = await PUT(put({ questionIds: ["q1"] }), ctx());
    expect(res.status).toBe(409);
    expect(ctqCreateMany).not.toHaveBeenCalled();
  });

  it("400 when a question is not an eligible bank/custom question", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    assessmentQuestionFindMany.mockResolvedValue([{ id: "q1" }]); // only 1 of 2 allowed
    const res = await PUT(put({ questionIds: ["q1", "q2"] }), ctx());
    expect(res.status).toBe(400);
    expect(ctqDeleteMany).not.toHaveBeenCalled();
  });

  it("replaces the question set in order", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    assessmentQuestionFindMany.mockResolvedValue([{ id: "q1" }, { id: "q2" }]);
    const res = await PUT(put({ questionIds: ["q2", "q1"] }), ctx());
    expect(res.status).toBe(200);
    expect(ctqDeleteMany).toHaveBeenCalledWith({ where: { classTestId: "t1" } });
    expect(ctqCreateMany).toHaveBeenCalledWith({
      data: [
        { classTestId: "t1", questionId: "q2", position: 0 },
        { classTestId: "t1", questionId: "q1", position: 1 },
      ],
    });
    // The eligibility query scopes to bank-of-this-subject OR owned custom.
    expect(assessmentQuestionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { origin: "BANK", active: true, subject: "MATH" },
            { origin: "TUTOR", ownerTutorProfileId: "tp1" },
          ]),
        }),
      })
    );
  });
});
