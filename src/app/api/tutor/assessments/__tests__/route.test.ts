import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  attemptFindFirst,
  attemptAggregate,
  attemptCreate,
  certFindUnique,
  configFindUnique,
  questionCount,
  pickQuestionIdsMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  attemptFindFirst: vi.fn(),
  attemptAggregate: vi.fn(),
  attemptCreate: vi.fn(),
  certFindUnique: vi.fn(),
  configFindUnique: vi.fn(),
  questionCount: vi.fn(),
  pickQuestionIdsMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/assessmentPicker", () => ({ pickQuestionIds: pickQuestionIdsMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    assessmentAttempt: { findFirst: attemptFindFirst, aggregate: attemptAggregate, create: attemptCreate },
    topicCertification: { findUnique: certFindUnique },
    topicAssessmentConfig: { findUnique: configFindUnique },
    assessmentQuestion: { count: questionCount },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        assessmentAttempt: { aggregate: attemptAggregate, create: attemptCreate },
      }),
  },
}));

import { POST } from "@/app/api/tutor/assessments/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };

function post(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/assessments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const validBody = { subject: "MATH", topic: "Algebraic Expressions" };

function fakeAttempt(itemIds: string[]) {
  return {
    id: "at1",
    subject: "MATH",
    topic: "Algebraic Expressions",
    attemptNo: 1,
    status: "IN_PROGRESS",
    questionCount: itemIds.length,
    passPercent: 80,
    correctCount: 0,
    scorePercent: 0,
    startedAt: new Date(),
    submittedAt: null,
    items: itemIds.map((id, i) => ({
      position: i,
      questionId: id,
      selectedOptionId: null,
      isCorrect: null,
      question: { prompt: `Q ${id}`, explanation: null, options: [{ id: `${id}o1`, text: "a", isCorrect: true, position: 0 }] },
    })),
  };
}

describe("POST /api/tutor/assessments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    attemptFindFirst.mockResolvedValue(null);
    certFindUnique.mockResolvedValue(null);
    configFindUnique.mockResolvedValue(null);
    attemptAggregate.mockResolvedValue({ _max: { attemptNo: null } });
  });

  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
  });

  it("404 when the tutor has no profile", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await POST(post(validBody));
    expect(res.status).toBe(404);
  });

  it("409 BANK_NOT_READY when the active bank is smaller than minBankSize", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    questionCount.mockResolvedValue(3); // default minBankSize is 5

    const res = await POST(post(validBody));
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.code).toBe("BANK_NOT_READY");
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it("409 when the tutor is already certified for the topic", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    certFindUnique.mockResolvedValue({ status: "CERTIFIED" });

    const res = await POST(post(validBody));
    expect(res.status).toBe(409);
    expect(questionCount).not.toHaveBeenCalled();
  });

  it("resumes an in-progress attempt instead of starting a new one", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    attemptFindFirst.mockResolvedValue(fakeAttempt(["q1", "q2"]));

    const res = await POST(post(validBody));
    expect(res.status).toBe(200);
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it("201 creates an attempt with the picked questions when the bank is ready", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    questionCount.mockResolvedValue(12);
    pickQuestionIdsMock.mockResolvedValue(["q1", "q2", "q3", "q4", "q5"]);
    attemptCreate.mockResolvedValue(fakeAttempt(["q1", "q2", "q3", "q4", "q5"]));

    const res = await POST(post(validBody));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.items).toHaveLength(5);
    // Answers must not be revealed for an in-progress attempt.
    expect(json.items[0].options[0]).not.toHaveProperty("isCorrect");
    expect(attemptCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tutorProfileId: "tp1",
          attemptNo: 1,
          passPercent: 80,
          items: { create: [
            { questionId: "q1", position: 0 },
            { questionId: "q2", position: 1 },
            { questionId: "q3", position: 2 },
            { questionId: "q4", position: 3 },
            { questionId: "q5", position: 4 },
          ] },
        }),
      })
    );
  });
});
