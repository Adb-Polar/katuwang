import { expect, it } from "vitest";
import { serializeAttempt, type AttemptWithItems } from "@/lib/assessmentSerialize";
const attempt = {
  id: "a1", status: "FAILED", startedAt: new Date(), submittedAt: new Date(), correctCount: 0, scorePercent: 0,
  items: [{ position: 0, questionId: "q1", selectedOptionId: "wrong", isCorrect: false,
    question: { prompt: "QA question", explanation: "The answer is disclosed here", options: [{ id: "right", text: "4", position: 0, isCorrect: true }, { id: "wrong", text: "5", position: 1, isCorrect: false }] } }],
} as unknown as AttemptWithItems;
it("returns submitted score and selected-answer feedback without leaking the answer key or explanation", () => {
  const result = serializeAttempt(attempt, { reveal: true, revealAnswers: false });
  expect(result.scorePercent).toBe(0);
  expect(result.items[0].isCorrect).toBe(false);
  expect(result.items[0]).not.toHaveProperty("explanation");
  expect(result.items[0].options.every((o) => !("isCorrect" in o))).toBe(true);
});
it("preserves full authorized administrative review", () => {
  const result = serializeAttempt(attempt, { reveal: true });
  expect(result.items[0].explanation).toBe("The answer is disclosed here");
  expect(result.items[0].options[0].isCorrect).toBe(true);
});
