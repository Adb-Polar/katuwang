import type { Prisma } from "@prisma/client";
import { attemptDeadline, wasSubmittedLate } from "@/lib/attemptDeadline";
import { seededShuffle } from "@/lib/seededShuffle";

// ─── Attempt (learner's run) ───────────────────────────────────────────────

export type SessionTestAttemptWithItems = Prisma.SessionTestAttemptGetPayload<{
  include: {
    items: { include: { question: { include: { options: true } } } };
    sessionTest: { select: { id: true; title: true; instructions: true } };
  };
}>;

export interface SerializedSessionTestItem {
  position: number;
  questionId: string;
  prompt: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

export interface SerializedSessionTestAttempt {
  id: string;
  testId: string;
  kind: string;
  title: string;
  instructions: string | null;
  status: string;
  totalQuestions: number;
  correctCount?: number;
  scorePercent?: number;
  startedAt: string;
  submittedAt: string | null;
  /** Minutes allowed for this attempt; null = untimed. */
  timeLimitMinutes: number | null;
  /** When the time runs out (ISO); null = untimed. */
  deadlineAt: string | null;
  /** Handed in after the deadline and its grace period. Still graded. */
  submittedLate: boolean;
  answersRevealed: boolean;
  items: SerializedSessionTestItem[];
}

/**
 * Shapes a learner's session-test attempt for a detail view. When `reveal` is
 * false (an in-progress attempt), correct-answer flags, explanations, per-item
 * grades and the score are stripped — the keys are absent, not nulled — and a
 * post-test's questions and options come back in a per-attempt random order.
 */
export function serializeSessionTestAttempt(
  attempt: SessionTestAttemptWithItems,
  { reveal, revealAnswers = true }: { reveal: boolean; revealAnswers?: boolean },
): SerializedSessionTestAttempt {
  // An in-progress post-test is shown in a per-attempt random order (questions and options),
  // so it cannot be answered from memory of the pre-test or by copying a neighbour. The order
  // is derived from the attempt id, so resuming shows the same order and nothing is stored.
  // Stored positions are untouched: grading is by id, and results are read in the tutor's order.
  const randomized = attempt.kind === "POST" && !reveal;
  const showAnswers = reveal && revealAnswers;
  const authored = [...attempt.items].sort((a, b) => a.position - b.position);
  const ordered = randomized ? seededShuffle(authored, attempt.id) : authored;

  const items = ordered.map((item, index) => {
    const authoredOptions = [...item.question.options].sort((a, b) => a.position - b.position);
    const options = (randomized ? seededShuffle(authoredOptions, `${attempt.id}:${item.questionId}`) : authoredOptions)
      .map((o) => ({ id: o.id, text: o.text, ...(showAnswers ? { isCorrect: o.isCorrect } : {}) }));

    return {
      // The number the learner sees: the shown order while randomized, else the tutor's.
      position: randomized ? index : item.position,
      questionId: item.questionId,
      prompt: item.question.prompt,
      options,
      selectedOptionId: item.selectedOptionId,
      ...(showAnswers
        ? { isCorrect: item.isCorrect, explanation: item.question.explanation }
        : {}),
    };
  });

  return {
    id: attempt.id,
    testId: attempt.sessionTest.id,
    kind: attempt.kind,
    title: attempt.sessionTest.title,
    instructions: attempt.sessionTest.instructions,
    status: attempt.status,
    totalQuestions: attempt.totalQuestions,
    ...(reveal
      ? { correctCount: attempt.correctCount, scorePercent: attempt.scorePercent }
      : {}),
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
    timeLimitMinutes: attempt.timeLimitMinutes,
    deadlineAt: attemptDeadline(attempt)?.toISOString() ?? null,
    submittedLate: wasSubmittedLate(attempt),
    answersRevealed: reveal && revealAnswers,
    items,
  };
}

// ─── Test (tutor's build) ──────────────────────────────────────────────────

export type SessionTestWithQuestions = Prisma.SessionTestGetPayload<{
  include: {
    questions: { include: { question: { include: { options: true } } } };
  };
}>;

export interface SerializedSessionTestQuestion {
  questionId: string;
  position: number;
  prompt: string;
  explanation: string | null;
  origin: string;
  subject: string;
  topic: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface SerializedSessionTest {
  id: string;
  sessionId: string;
  title: string;
  instructions: string | null;
  timeLimitMinutes: number | null;
  status: string;
  publishedAt: string | null;
  pretestClosedAt: string | null;
  posttestOpenedAt: string | null;
  closedAt: string | null;
  questions: SerializedSessionTestQuestion[];
}

/** Full test with answers — for the tutor builder / admin view. */
export function serializeSessionTest(test: SessionTestWithQuestions): SerializedSessionTest {
  return {
    id: test.id,
    sessionId: test.sessionId,
    title: test.title,
    instructions: test.instructions,
    timeLimitMinutes: test.timeLimitMinutes,
    status: test.status,
    publishedAt: test.publishedAt ? test.publishedAt.toISOString() : null,
    pretestClosedAt: test.pretestClosedAt ? test.pretestClosedAt.toISOString() : null,
    posttestOpenedAt: test.posttestOpenedAt ? test.posttestOpenedAt.toISOString() : null,
    closedAt: test.closedAt ? test.closedAt.toISOString() : null,
    questions: [...test.questions]
      .sort((a, b) => a.position - b.position)
      .map((link) => ({
        questionId: link.questionId,
        position: link.position,
        prompt: link.question.prompt,
        explanation: link.question.explanation,
        origin: link.question.origin,
        subject: link.question.subject,
        topic: link.question.topic,
        options: [...link.question.options]
          .sort((a, b) => a.position - b.position)
          .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      })),
  };
}
