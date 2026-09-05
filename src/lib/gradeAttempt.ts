// Shared MCQ grading arithmetic — used by both the tutor certification quiz and
// the per-session pre/post tests, so the "one correct option, unanswered =
// wrong, score is rounded %" rule lives in exactly one place.

export interface GradableItem {
  id: string;
  questionId: string;
  question: { options: { id: string; isCorrect: boolean }[] };
}

export interface GradedItem {
  id: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
}

export interface GradeResult {
  graded: GradedItem[];
  correctCount: number;
  scorePercent: number;
}

/**
 * Grade each served item against the learner's answers. An unanswered question,
 * or one whose chosen option id is not among that item's options, counts wrong.
 * `total` is the denominator for the percentage (the served question count) so a
 * missing answer still drags the score down.
 */
export function gradeAttempt(
  items: GradableItem[],
  answers: { questionId: string; optionId: string }[],
  total: number,
): GradeResult {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.optionId]));

  const graded: GradedItem[] = items.map((item) => {
    const chosenId = answerByQuestion.get(item.questionId) ?? null;
    const chosen = item.question.options.find((o) => o.id === chosenId) ?? null;
    return {
      id: item.id,
      selectedOptionId: chosen ? chosen.id : null,
      isCorrect: chosen?.isCorrect === true,
    };
  });

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return { graded, correctCount, scorePercent };
}
