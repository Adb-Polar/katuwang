import { describe, it, expect } from "vitest";
import {
  serializeSessionTest,
  serializeSessionTestAttempt,
  type SessionTestAttemptWithItems,
  type SessionTestWithQuestions,
} from "@/lib/sessionTestSerialize";

const baseAttempt = {
  id: "at1",
  sessionTestId: "st1",
  learnerId: "L1",
  kind: "PRE",
  status: "IN_PROGRESS",
  totalQuestions: 1,
  correctCount: 0,
  scorePercent: 0,
  startedAt: new Date("2026-09-01T00:00:00Z"),
  submittedAt: null,
  sessionTest: { id: "st1", title: "Fractions check-in", instructions: null },
  items: [
    {
      id: "i1",
      attemptId: "at1",
      questionId: "q1",
      position: 0,
      selectedOptionId: null,
      isCorrect: null,
      question: {
        id: "q1",
        prompt: "2 + 2 = ?",
        explanation: "Basic addition.",
        options: [
          { id: "o1", questionId: "q1", text: "3", isCorrect: false, position: 0 },
          { id: "o2", questionId: "q1", text: "4", isCorrect: true, position: 1 },
        ],
      },
    },
  ],
} as unknown as SessionTestAttemptWithItems;

describe("serializeSessionTestAttempt", () => {
  it("takes `kind` from the attempt, not the test", () => {
    const s = serializeSessionTestAttempt(baseAttempt, { reveal: false });
    expect(s.kind).toBe("PRE");
    expect(s.testId).toBe("st1");
  });

  it("strips correct-answer info, explanations, grades and score when reveal is false", () => {
    const s = serializeSessionTestAttempt(baseAttempt, { reveal: false });
    expect(s).not.toHaveProperty("correctCount");
    expect(s).not.toHaveProperty("scorePercent");
    expect(s.items[0]).not.toHaveProperty("isCorrect");
    expect(s.items[0]).not.toHaveProperty("explanation");
    expect(s.items[0].options.every((o) => !("isCorrect" in o))).toBe(true);
  });

  it("includes everything when reveal is true", () => {
    const submitted = {
      ...baseAttempt,
      status: "SUBMITTED",
      correctCount: 1,
      scorePercent: 100,
      submittedAt: new Date("2026-09-01T01:00:00Z"),
      items: [{ ...baseAttempt.items[0], selectedOptionId: "o2", isCorrect: true }],
    } as unknown as SessionTestAttemptWithItems;
    const s = serializeSessionTestAttempt(submitted, { reveal: true });
    expect(s.correctCount).toBe(1);
    expect(s.scorePercent).toBe(100);
    expect(s.items[0].isCorrect).toBe(true);
    expect(s.items[0].explanation).toBe("Basic addition.");
    expect(s.items[0].options.find((o) => o.id === "o2")?.isCorrect).toBe(true);
  });
});

describe("serializeSessionTest", () => {
  it("has no `kind` field — one set served twice", () => {
    const test = {
      id: "st1",
      sessionId: "s1",
      title: "Fractions check-in",
      instructions: null,
      status: "DRAFT",
      publishedAt: null,
      closedAt: null,
      questions: [
        {
          id: "l1",
          sessionTestId: "st1",
          questionId: "q1",
          position: 0,
          question: {
            id: "q1",
            prompt: "2 + 2 = ?",
            explanation: null,
            origin: "BANK",
            subject: "MATH",
            topic: "Addition",
            options: [{ id: "o1", questionId: "q1", text: "4", isCorrect: true, position: 0 }],
          },
        },
      ],
    } as unknown as SessionTestWithQuestions;

    const s = serializeSessionTest(test);
    expect(s).not.toHaveProperty("kind");
    expect(s.sessionId).toBe("s1");
    expect(s.questions[0].origin).toBe("BANK");
  });
});
