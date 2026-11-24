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

describe("serializeSessionTestAttempt — shuffled order and time limit", () => {
  const QUESTION_COUNT = 8;
  const manyItems = Array.from({ length: QUESTION_COUNT }, (_, i) => ({
    id: `i${i}`,
    attemptId: "at1",
    questionId: `q${i}`,
    position: i,
    selectedOptionId: null,
    isCorrect: null,
    question: {
      id: `q${i}`,
      prompt: `Question ${i}`,
      explanation: null,
      options: ["a", "b", "c", "d"].map((letter, position) => ({
        id: `q${i}${letter}`,
        questionId: `q${i}`,
        text: letter,
        isCorrect: position === 0,
        position,
      })),
    },
  }));
  const attemptWith = (id: string, timeLimitMinutes: number | null = null) =>
    ({
      ...baseAttempt,
      id,
      totalQuestions: QUESTION_COUNT,
      sessionTest: { id: "st1", title: "t", instructions: null, timeLimitMinutes },
      items: manyItems,
    }) as unknown as SessionTestAttemptWithItems;
  const questionOrder = (id: string, shuffled: boolean) =>
    serializeSessionTestAttempt(attemptWith(id), { reveal: false, shuffled }).items.map((i) => i.questionId);

  it("keeps the authored order when not shuffled", () => {
    expect(questionOrder("at1", false)).toEqual(manyItems.map((i) => i.questionId));
  });

  it("serves the same shuffled order every time for one attempt", () => {
    expect(questionOrder("at1", true)).toEqual(questionOrder("at1", true));
  });

  it("serves different orders to different attempts", () => {
    const orders = new Set(["at1", "at2", "at3", "at4"].map((id) => questionOrder(id, true).join(",")));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("serves every question exactly once and renumbers positions from 0", () => {
    const { items } = serializeSessionTestAttempt(attemptWith("at1"), { reveal: false, shuffled: true });
    expect([...items.map((i) => i.questionId)].sort()).toEqual(manyItems.map((i) => i.questionId).sort());
    expect(items.map((i) => i.position)).toEqual(manyItems.map((_, index) => index));
  });

  it("shuffles options without losing any", () => {
    const { items } = serializeSessionTestAttempt(attemptWith("at1"), { reveal: false, shuffled: true });
    const optionOrders = new Set(items.map((i) => i.options.map((o) => o.text).join("")));
    expect(optionOrders.size).toBeGreaterThan(1);
    expect(items.every((i) => [...i.options.map((o) => o.text)].sort().join("") === "abcd")).toBe(true);
  });

  it("reports the deadline for a timed test", () => {
    const s = serializeSessionTestAttempt(attemptWith("at1", 15), { reveal: false });
    expect(s.timeLimitMinutes).toBe(15);
    expect(s.deadlineAt).toBe("2026-09-01T00:15:00.000Z");
  });

  it("reports no deadline for an untimed test", () => {
    const s = serializeSessionTestAttempt(attemptWith("at1", null), { reveal: false });
    expect(s.deadlineAt).toBeNull();
  });
});
