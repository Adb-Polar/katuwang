import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  sessionTestAttemptFindUnique,
  sessionTestAttemptItemUpdate,
  sessionTestAttemptRead,
  attemptClaim,
  sessionTestFindUnique,
  notifyMock,
  accessMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  sessionTestAttemptFindUnique: vi.fn(),
  sessionTestAttemptItemUpdate: vi.fn(),
  sessionTestAttemptRead: vi.fn(),
  attemptClaim: vi.fn(),
  sessionTestFindUnique: vi.fn(),
  notifyMock: vi.fn(),
  accessMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/sessionTestAccess", () => ({ checkLearnerAttemptAccess: accessMock }));
vi.mock("@/lib/notifications", () => ({ notify: notifyMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    sessionTestAttempt: { findUnique: sessionTestAttemptFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        sessionTestAttemptItem: { update: sessionTestAttemptItemUpdate },
        sessionTestAttempt: { updateMany: attemptClaim, findUniqueOrThrow: sessionTestAttemptRead },
        sessionTest: { findUnique: sessionTestFindUnique },
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
  accessMock.mockResolvedValue(null);
  attemptClaim.mockResolvedValue({ count: 1 });
  sessionTestAttemptFindUnique.mockResolvedValue(inProgressAttempt);
});

describe("POST /learner/session-test-attempts/[attemptId]/submit", () => {
  it("404 when it's not the caller's attempt (not 403 — don't confirm the id)", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ ...inProgressAttempt, learnerId: "OTHER" });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(404);
  });

  it("409 re-submitting an already-submitted attempt", async () => {
    sessionTestAttemptFindUnique.mockResolvedValue({ ...inProgressAttempt, status: "SUBMITTED" });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(409);
  });

  it.each(["Enrollment withdrawn", "Class under moderation", "Tests disabled"])("blocks writes when access changed: %s", async (error) => {
    accessMock.mockResolvedValue({ error, status: 403 });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(403);
    expect(sessionTestAttemptItemUpdate).not.toHaveBeenCalled();
    expect(sessionTestAttemptRead).not.toHaveBeenCalled();
  });

  it("does not write items or notify when another submission wins", async () => {
    attemptClaim.mockResolvedValue({ count: 0 });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(409);
    expect(sessionTestAttemptItemUpdate).not.toHaveBeenCalled();
    expect(sessionTestAttemptRead).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("rolls back before grading if access changes while waiting to claim", async () => {
    accessMock.mockResolvedValueOnce(null).mockResolvedValueOnce({ error: "Enrollment withdrawn", status: 403 });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(403);
    expect(attemptClaim).toHaveBeenCalledOnce();
    expect(sessionTestAttemptItemUpdate).not.toHaveBeenCalled();
    expect(sessionTestAttemptRead).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("400 on a malformed body", async () => {
    const res = await POST(post({ answers: "not-an-array" }), ctx());
    expect(res.status).toBe(400);
  });

  it("200 grades, persists, and reveals the result", async () => {
    sessionTestAttemptRead.mockResolvedValue({
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
    expect(attemptClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUBMITTED", correctCount: 1, scorePercent: 100 }),
      }),
    );
  });

  it("notifies the tutor once a PRE attempt is submitted", async () => {
    sessionTestAttemptRead.mockResolvedValue({
      ...inProgressAttempt,
      kind: "PRE",
      sessionTestId: "st1",
      status: "SUBMITTED",
      correctCount: 1,
      scorePercent: 100,
      startedAt: new Date(),
      submittedAt: new Date(),
      items: [{ ...inProgressAttempt.items[0], selectedOptionId: "o2", isCorrect: true }],
    });
    sessionTestFindUnique.mockResolvedValue({
      sessionId: "s1",
      session: {
        classId: "c1",
        topic: "Algebra",
        class: { tutorProfile: { userId: "T1" } },
      },
    });

    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(200);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.anything(),
      "T1",
      "SESSION_PRETEST_TAKEN",
      expect.stringContaining("Algebra"),
      "/tutor/classes/c1/sessions/s1/test/results",
    );
  });

  it("does not notify anyone for a POST attempt", async () => {
    sessionTestAttemptRead.mockResolvedValue({
      ...inProgressAttempt,
      kind: "POST",
      sessionTestId: "st1",
      status: "SUBMITTED",
      correctCount: 1,
      scorePercent: 100,
      startedAt: new Date(),
      submittedAt: new Date(),
      items: [{ ...inProgressAttempt.items[0], selectedOptionId: "o2", isCorrect: true }],
    });

    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "o2" }] }), ctx());
    expect(res.status).toBe(200);
    expect(notifyMock).not.toHaveBeenCalled();
    expect(sessionTestFindUnique).not.toHaveBeenCalled();
  });
});
