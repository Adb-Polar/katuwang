import { describe, it, expect } from "vitest";
import { gradeAttempt } from "@/lib/gradeAttempt";

function item(id: string, questionId: string, options: { id: string; isCorrect: boolean }[]) {
  return { id, questionId, question: { options } };
}

describe("gradeAttempt", () => {
  it("marks a chosen correct option as correct", () => {
    const items = [item("i1", "q1", [{ id: "a", isCorrect: true }, { id: "b", isCorrect: false }])];
    const { graded, correctCount, scorePercent } = gradeAttempt(
      items,
      [{ questionId: "q1", optionId: "a" }],
      1,
    );
    expect(graded[0]).toEqual({ id: "i1", selectedOptionId: "a", isCorrect: true });
    expect(correctCount).toBe(1);
    expect(scorePercent).toBe(100);
  });

  it("treats an unanswered question as wrong", () => {
    const items = [item("i1", "q1", [{ id: "a", isCorrect: true }])];
    const { graded, correctCount } = gradeAttempt(items, [], 1);
    expect(graded[0]).toEqual({ id: "i1", selectedOptionId: null, isCorrect: false });
    expect(correctCount).toBe(0);
  });

  it("treats an option id not belonging to the question as wrong", () => {
    const items = [item("i1", "q1", [{ id: "a", isCorrect: true }])];
    const { graded } = gradeAttempt(items, [{ questionId: "q1", optionId: "not-an-option" }], 1);
    expect(graded[0].selectedOptionId).toBeNull();
    expect(graded[0].isCorrect).toBe(false);
  });

  it("rounds the percentage and uses `total` as the denominator (missing answers drag it down)", () => {
    const items = [
      item("i1", "q1", [{ id: "a", isCorrect: true }]),
      item("i2", "q2", [{ id: "b", isCorrect: true }]),
    ];
    // total=3 even though only 2 items were served — simulates a partially-answered set.
    const { correctCount, scorePercent } = gradeAttempt(
      items,
      [{ questionId: "q1", optionId: "a" }, { questionId: "q2", optionId: "b" }],
      3,
    );
    expect(correctCount).toBe(2);
    expect(scorePercent).toBe(67); // round(2/3 * 100)
  });

  it("returns 0% for a zero-question total instead of dividing by zero", () => {
    const { scorePercent } = gradeAttempt([], [], 0);
    expect(scorePercent).toBe(0);
  });
});
