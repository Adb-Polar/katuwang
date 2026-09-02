import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  attemptFindUnique,
  attemptUpdate,
  itemUpdate,
  certFindUnique,
  certUpsert,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  attemptFindUnique: vi.fn(),
  attemptUpdate: vi.fn(),
  itemUpdate: vi.fn(),
  certFindUnique: vi.fn(),
  certUpsert: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessmentAttempt: { findUnique: attemptFindUnique },
    topicCertification: { findUnique: certFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        assessmentAttemptItem: { update: itemUpdate },
        assessmentAttempt: { update: attemptUpdate },
        topicCertification: { upsert: certUpsert },
      }),
  },
}));

import { POST } from "@/app/api/tutor/assessments/[attemptId]/submit/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const params = (attemptId = "at1") => ({ params: Promise.resolve({ attemptId }) });

function post(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/assessments/at1/submit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function fakeAttempt({ passPercent = 50, status = "IN_PROGRESS" as string } = {}) {
  return {
    id: "at1",
    subject: "MATH",
    topic: "Algebraic Expressions",
    attemptNo: 1,
    status,
    questionCount: 2,
    passPercent,
    correctCount: 0,
    scorePercent: 0,
    startedAt: new Date(),
    submittedAt: null,
    tutorProfile: { id: "tp1", userId: "U1" },
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
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  certFindUnique.mockResolvedValue(null);
  getSettingMock.mockResolvedValue(false);
  attemptUpdate.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
    ...fakeAttempt(),
    ...data,
  }));
});

describe("POST /api/tutor/assessments/[attemptId]/submit", () => {
  it("404 when the attempt belongs to another tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    attemptFindUnique.mockResolvedValue({ ...fakeAttempt(), tutorProfile: { id: "tp9", userId: "OTHER" } });
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "q1a" }] }), params());
    expect(res.status).toBe(404);
  });

  it("409 when the attempt was already submitted", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    attemptFindUnique.mockResolvedValue(fakeAttempt({ status: "PASSED" }));
    const res = await POST(post({ answers: [{ questionId: "q1", optionId: "q1a" }] }), params());
    expect(res.status).toBe(409);
  });

  it("grades both-correct as 100% PASSED and, with auto-certify on, certifies the topic", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    getSettingMock.mockResolvedValue(true);
    attemptFindUnique.mockResolvedValue(fakeAttempt({ passPercent: 80 }));

    const res = await POST(
      post({ answers: [
        { questionId: "q1", optionId: "q1a" },
        { questionId: "q2", optionId: "q2a" },
      ] }),
      params()
    );
    expect(res.status).toBe(200);
    expect(attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PASSED", correctCount: 2, scorePercent: 100 }) })
    );
    expect(certUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ status: "CERTIFIED" }) })
    );
  });

  it("PASSED with auto-certify off creates a PENDING certification carrying the score", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    getSettingMock.mockResolvedValue(false);
    attemptFindUnique.mockResolvedValue(fakeAttempt({ passPercent: 50 }));

    const res = await POST(
      post({ answers: [
        { questionId: "q1", optionId: "q1a" },
        { questionId: "q2", optionId: "q2b" },
      ] }),
      params()
    );
    expect(res.status).toBe(200);
    expect(attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PASSED", scorePercent: 50 }) })
    );
    expect(certUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "PENDING", reviewNote: expect.stringContaining("50%") }),
      })
    );
  });

  it("grades all-wrong as FAILED and marks the certification REJECTED", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    attemptFindUnique.mockResolvedValue(fakeAttempt({ passPercent: 50 }));

    const res = await POST(
      post({ answers: [
        { questionId: "q1", optionId: "q1b" },
        { questionId: "q2", optionId: "q2b" },
      ] }),
      params()
    );
    expect(res.status).toBe(200);
    expect(attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", correctCount: 0, scorePercent: 0 }) })
    );
    expect(certUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ status: "REJECTED" }) })
    );
  });

  it("does not touch the certification when the tutor is already CERTIFIED", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    certFindUnique.mockResolvedValue({ status: "CERTIFIED" });
    attemptFindUnique.mockResolvedValue(fakeAttempt({ passPercent: 50 }));

    const res = await POST(
      post({ answers: [
        { questionId: "q1", optionId: "q1b" },
        { questionId: "q2", optionId: "q2b" },
      ] }),
      params()
    );
    expect(res.status).toBe(200);
    expect(certUpsert).not.toHaveBeenCalled();
  });
});
