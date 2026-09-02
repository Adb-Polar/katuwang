import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, attemptFindUnique, attemptUpdate, itemUpdate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  attemptFindUnique: vi.fn(),
  attemptUpdate: vi.fn(),
  itemUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    classTestAttempt: { findUnique: attemptFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        classTestAttemptItem: { update: itemUpdate },
        classTestAttempt: { update: attemptUpdate },
      }),
  },
}));

import { POST } from "@/app/api/learner/class-test-attempts/[attemptId]/submit/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const ctx = () => ({ params: Promise.resolve({ attemptId: "a1" }) });
const req = (body: unknown) =>
  new NextRequest("http://localhost/api/learner/class-test-attempts/a1/submit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

function fakeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    learnerId: "L1",
    status: "IN_PROGRESS",
    totalQuestions: 2,
    startedAt: new Date(),
    submittedAt: null,
    classTest: { id: "t1", kind: "PRE", title: "Pre", instructions: null },
    items: [
      {
        id: "it1",
        questionId: "q1",
        position: 0,
        selectedOptionId: null,
        isCorrect: null,
        question: {
          prompt: "Q1",
          explanation: null,
          options: [
            { id: "q1a", text: "right", isCorrect: true, position: 0 },
            { id: "q1b", text: "wrong", isCorrect: false, position: 1 },
          ],
        },
      },
      {
        id: "it2",
        questionId: "q2",
        position: 1,
        selectedOptionId: null,
        isCorrect: null,
        question: {
          prompt: "Q2",
          explanation: null,
          options: [
            { id: "q2a", text: "right", isCorrect: true, position: 0 },
            { id: "q2b", text: "wrong", isCorrect: false, position: 1 },
          ],
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  attemptUpdate.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
    ...fakeAttempt(),
    ...data,
  }));
});

describe("POST /api/learner/class-test-attempts/[attemptId]/submit", () => {
  it("404 when the attempt belongs to another learner", async () => {
    attemptFindUnique.mockResolvedValue(fakeAttempt({ learnerId: "OTHER" }));
    const res = await POST(req({ answers: [{ questionId: "q1", optionId: "q1a" }] }), ctx());
    expect(res.status).toBe(404);
  });

  it("409 when the attempt is already submitted", async () => {
    attemptFindUnique.mockResolvedValue(fakeAttempt({ status: "SUBMITTED" }));
    const res = await POST(req({ answers: [{ questionId: "q1", optionId: "q1a" }] }), ctx());
    expect(res.status).toBe(409);
  });

  it("grades one-of-two correct as 50%", async () => {
    attemptFindUnique.mockResolvedValue(fakeAttempt());
    const res = await POST(
      req({ answers: [
        { questionId: "q1", optionId: "q1a" },
        { questionId: "q2", optionId: "q2b" },
      ] }),
      ctx()
    );
    expect(res.status).toBe(200);
    expect(attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUBMITTED", correctCount: 1, scorePercent: 50 }),
      })
    );
  });

  it("grades all correct as 100%", async () => {
    attemptFindUnique.mockResolvedValue(fakeAttempt());
    await POST(
      req({ answers: [
        { questionId: "q1", optionId: "q1a" },
        { questionId: "q2", optionId: "q2a" },
      ] }),
      ctx()
    );
    expect(attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ correctCount: 2, scorePercent: 100 }) })
    );
  });
});
