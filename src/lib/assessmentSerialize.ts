import type { Prisma } from "@prisma/client";
import { attemptDeadline } from "@/lib/attemptDeadline";
import { seededShuffle } from "@/lib/shuffle";

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
  /** ISO instant the attempt auto-submits; `null` = untimed. */
  deadlineAt: string | null;
  items: SerializedAttemptItem[];
}

/**
 * Shapes an attempt for a detail view. When `reveal` is false (a tutor viewing
 * an in-progress attempt), correct-answer flags, explanations, per-item grades
 * and the running score are stripped.
 *
 * `shuffled` (the tutor's own views) serves each question's options in an
 * order derived from the attempt id — different per attempt, stable on resume.
 * Question order is already randomised when the attempt is created.
 * `timeLimitMinutes` is the live platform setting (0 / omitted = untimed).
 */
export function serializeAttempt(
  attempt: AttemptWithItems,
  { reveal, shuffled = false, timeLimitMinutes }: { reveal: boolean; shuffled?: boolean; timeLimitMinutes?: number }
): SerializedAttempt {
  const deadline = attemptDeadline(attempt.startedAt, timeLimitMinutes);
  const items = [...attempt.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const authoredOptions = [...item.question.options].sort((a, b) => a.position - b.position);
      const options = (shuffled ? seededShuffle(authoredOptions, `${attempt.id}:${item.questionId}`) : authoredOptions)
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
    deadlineAt: deadline ? deadline.toISOString() : null,
    items,
  };
}
