import { prisma } from "@/lib/prisma";

export interface ClassTestResults {
  test: { id: string; kind: string; title: string; status: string; classCode: string };
  siblingKind: "PRE" | "POST" | null;
  totals: {
    enrolled: number;
    submitted: number;
    avgScore: number | null; // this test
    avgSiblingScore: number | null;
    avgDelta: number | null; // sibling(POST) - this(PRE) style, only when both exist
  };
  learners: {
    id: string;
    anonymousId: string;
    attemptId: string | null;
    score: number | null;
    submittedAt: string | null;
    siblingScore: number | null;
    delta: number | null;
  }[];
  questionStats: {
    position: number;
    prompt: string;
    answered: number;
    correct: number;
    correctRate: number | null;
  }[];
}

function avg(nums: number[]): number | null {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

/**
 * Aggregates one class test's results plus the paired test's scores so a
 * pre→post delta can be shown. Returns null if the test does not exist.
 */
export async function buildClassTestResults(testId: string): Promise<ClassTestResults | null> {
  const test = await prisma.classTest.findUnique({
    where: { id: testId },
    include: {
      class: {
        select: {
          code: true,
          enrollments: {
            include: { learner: { select: { id: true, anonymousId: true } } },
          },
        },
      },
      questions: {
        orderBy: { position: "asc" },
        include: { question: { select: { prompt: true } } },
      },
      attempts: {
        where: { status: "SUBMITTED" },
        include: { items: { select: { position: true, isCorrect: true } } },
      },
    },
  });
  if (!test) return null;

  const siblingKind = test.kind === "PRE" ? "POST" : "PRE";
  const sibling = await prisma.classTest.findUnique({
    where: { classId_kind: { classId: test.classId, kind: siblingKind } },
    select: {
      id: true,
      attempts: {
        where: { status: "SUBMITTED" },
        select: { learnerId: true, scorePercent: true },
      },
    },
  });
  const siblingScoreByLearner = new Map(
    (sibling?.attempts ?? []).map((a) => [a.learnerId, a.scorePercent])
  );

  const attemptByLearner = new Map(test.attempts.map((a) => [a.learnerId, a]));

  const learners = test.class.enrollments
    .map((e) => e.learner)
    .sort((a, b) => a.anonymousId.localeCompare(b.anonymousId))
    .map((l) => {
      const attempt = attemptByLearner.get(l.id) ?? null;
      const score = attempt ? attempt.scorePercent : null;
      const siblingScore = siblingScoreByLearner.get(l.id) ?? null;
      // delta is always POST - PRE regardless of which test is being viewed
      let delta: number | null = null;
      if (score != null && siblingScore != null) {
        delta = test.kind === "POST" ? score - siblingScore : siblingScore - score;
      }
      return {
        id: l.id,
        anonymousId: l.anonymousId,
        attemptId: attempt?.id ?? null,
        score,
        submittedAt: attempt?.submittedAt ? attempt.submittedAt.toISOString() : null,
        siblingScore,
        delta,
      };
    });

  const submittedScores = learners.filter((l) => l.score != null).map((l) => l.score!);
  const siblingScores = learners.filter((l) => l.siblingScore != null).map((l) => l.siblingScore!);
  const deltas = learners.filter((l) => l.delta != null).map((l) => l.delta!);

  const questionStats = test.questions.map((link) => {
    let answered = 0;
    let correct = 0;
    for (const attempt of test.attempts) {
      const item = attempt.items.find((i) => i.position === link.position);
      if (!item || item.isCorrect == null) continue;
      answered++;
      if (item.isCorrect) correct++;
    }
    return {
      position: link.position,
      prompt: link.question.prompt,
      answered,
      correct,
      correctRate: answered ? Math.round((correct / answered) * 100) : null,
    };
  });

  return {
    test: {
      id: test.id,
      kind: test.kind,
      title: test.title,
      status: test.status,
      classCode: test.class.code,
    },
    siblingKind: sibling ? siblingKind : null,
    totals: {
      enrolled: test.class.enrollments.length,
      submitted: submittedScores.length,
      avgScore: avg(submittedScores),
      avgSiblingScore: avg(siblingScores),
      avgDelta: avg(deltas),
    },
    learners,
    questionStats,
  };
}
