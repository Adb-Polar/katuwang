import type { Prisma } from "@prisma/client";

/** Attempt with everything the detail views need, as fetched by the routes. */
export type AttemptWithItems = Prisma.AssessmentAttemptGetPayload<{
  include: {
    items: {
      include: { question: { include: { options: true } } };
    };
  };
}>;

export interface SerializedAttemptItem {
  position: number;
  questionId: string;
  prompt: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

export interface SerializedAttempt {
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: string;
  questionCount: number;
  passPercent: number;
  correctCount?: number;
  scorePercent?: number;
  startedAt: string;
  submittedAt: string | null;
  items: SerializedAttemptItem[];
}

/**
 * Shapes an attempt for a detail view. When `reveal` is false (a tutor viewing
 * an in-progress attempt), correct-answer flags, explanations, per-item grades
 * and the running score are stripped.
 */
export function serializeAttempt(
  attempt: AttemptWithItems,
  { reveal }: { reveal: boolean }
): SerializedAttempt {
  const items = [...attempt.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const options = [...item.question.options]
        .sort((a, b) => a.position - b.position)
        .map((o) => ({
          id: o.id,
          text: o.text,
          ...(reveal ? { isCorrect: o.isCorrect } : {}),
        }));

      return {
        position: item.position,
        questionId: item.questionId,
        prompt: item.question.prompt,
        options,
        selectedOptionId: item.selectedOptionId,
        ...(reveal
          ? { isCorrect: item.isCorrect, explanation: item.question.explanation }
          : {}),
      };
    });

  return {
    id: attempt.id,
    subject: attempt.subject,
    topic: attempt.topic,
    attemptNo: attempt.attemptNo,
    status: attempt.status,
    questionCount: attempt.questionCount,
    passPercent: attempt.passPercent,
    ...(reveal ? { correctCount: attempt.correctCount, scorePercent: attempt.scorePercent } : {}),
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
    items,
  };
}
