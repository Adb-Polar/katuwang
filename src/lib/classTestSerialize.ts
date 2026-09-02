import type { Prisma } from "@prisma/client";

// ─── Attempt (learner's run) ───────────────────────────────────────────────

export type ClassTestAttemptWithItems = Prisma.ClassTestAttemptGetPayload<{
  include: {
    items: { include: { question: { include: { options: true } } } };
    classTest: { select: { id: true; kind: true; title: true; instructions: true } };
  };
}>;

export interface SerializedClassTestItem {
  position: number;
  questionId: string;
  prompt: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

export interface SerializedClassTestAttempt {
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
  items: SerializedClassTestItem[];
}

/**
 * Shapes a learner's class-test attempt for a detail view. When `reveal` is
 * false (an in-progress attempt), correct-answer flags, explanations, per-item
 * grades and the score are stripped.
 */
export function serializeClassTestAttempt(
  attempt: ClassTestAttemptWithItems,
  { reveal }: { reveal: boolean }
): SerializedClassTestAttempt {
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
    testId: attempt.classTest.id,
    kind: attempt.classTest.kind,
    title: attempt.classTest.title,
    instructions: attempt.classTest.instructions,
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

export type ClassTestWithQuestions = Prisma.ClassTestGetPayload<{
  include: {
    questions: {
      include: { question: { include: { options: true } } };
    };
  };
}>;

export interface SerializedClassTestQuestion {
  questionId: string;
  position: number;
  prompt: string;
  explanation: string | null;
  origin: string;
  subject: string;
  topic: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface SerializedClassTest {
  id: string;
  classId: string;
  kind: string;
  title: string;
  instructions: string | null;
  status: string;
  publishedAt: string | null;
  closedAt: string | null;
  questions: SerializedClassTestQuestion[];
}

/** Full test with answers — for the tutor builder / admin view. */
export function serializeClassTest(test: ClassTestWithQuestions): SerializedClassTest {
  return {
    id: test.id,
    classId: test.classId,
    kind: test.kind,
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
