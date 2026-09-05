import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  sessionTestAttemptFindUnique,
  sessionTestAttemptItemUpdate,
  sessionTestAttemptUpdate,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  sessionTestAttemptFindUnique: vi.fn(),
  sessionTestAttemptItemUpdate: vi.fn(),
  sessionTestAttemptUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    sessionTestAttempt: { findUnique: sessionTestAttemptFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        sessionTestAttemptItem: { update: sessionTestAttemptItemUpdate },
        sessionTestAttempt: { update: sessionTestAttemptUpdate },
      }),
  },
}));

import { POST } from "@/app/api/learner/session-test-attempts/[attemptId]/submit/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const ctx = () => ({ params: Promise.resolve({ attemptId: "at1" }) });

function post(body: unknown) {
  return new NextRequest("http://localhost/x", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const inProgressAttempt = {
  id: "at1",
  learnerId: "L1",
  status: "IN_PROGRESS",
  totalQuestions: 1,
  sessionTest: { id: "st1", title: "t", instructions: null },
  items: [
    {
      id: "i1",
      questionId: "q1",
      position: 0,
      selectedOptionId: null,
      isCorrect: null,
      question: {
        prompt: "2+2?",
        explanation: null,
        options: [
          { id: "o1", isCorrect: false },
          { id: "o2", isCorrect: true },
        ],
      },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  sessionTestAttemptFindUnique.mockResolvedValue(inProgressAttempt);
});

describe("POST /learner/session-test-attempts/[attemptId]/submit", () => {
  it("404 when it's not the caller's attempt (not 403 — don't confirm the id)", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ ...inProgressAttempt, learnerId: "OTHER" });
    const res = await POST(post({ answers: [] }), ctx());
    expect(res.status).toBe(404);
  });

  it("409 re-submitting an already-submitted attempt", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ ...inProgressAttempt, status: "SUBMITTED" });
    const res = await POST(post({ answers: [] }), ctx());
    expect(res.status).toBe(409);
  });

  it("400 on a malformed body", async () => {
    const res = await POST(post({ answers: "not-an-array" }), ctx());
    expect(res.status).toBe(400);
  });

  it("200 grades, persists, and reveals the result", async () => {
    sessionTestAttemptUpdate.mockResolvedValue({
      ...inProgressAttempt,
      status: "SUBMITTED",
      correctCount: 1,
      scorePercent: 100,
      startedAt: new Date(),
      submittedAt: new Date(),
      items: [{ ...inProgressAttempt.items[0], selectedOptionId: "o2", isCorrect: true }],
    });

    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.scorePercent).toBe(100);
    expect(json.items[0].isCorrect).toBe(true);
    expect(sessionTestAttemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUBMITTED", correctCount: 1, scorePercent: 100 }),
      }),
    );
  });
});
