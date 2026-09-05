import type { Prisma } from "@prisma/client";

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
  items: SerializedSessionTestItem[];
}

/**
 * Shapes a learner's session-test attempt for a detail view. When `reveal` is
 * false (an in-progress attempt), correct-answer flags, explanations, per-item
 * grades and the score are stripped — the keys are absent, not nulled.
 */
export function serializeSessionTestAttempt(
  attempt: SessionTestAttemptWithItems,
  { reveal }: { reveal: boolean },
): SerializedSessionTestAttempt {
  const items = [...attempt.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const options = [...item.question.options]
        .sort((a, b) => a.position - b.position)
        .map((o) => ({ id: o.id, text: o.text, ...(reveal ? { isCorrect: o.isCorrect } : {}) }));

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
  status: string;
  publishedAt: string | null;
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
    status: test.status,
    publishedAt: test.publishedAt ? test.publishedAt.toISOString() : null,
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
