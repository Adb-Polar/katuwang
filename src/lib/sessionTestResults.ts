import { prisma } from "@/lib/prisma";

function avg(nums: number[]): number | null {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

// ─── One session test — charts (c) per-question rate + (d) per-learner delta ──

export interface SessionTestResults {
  test: {
    id: string;
    title: string;
    status: string;
    classCode: string;
    subject: string;
    sessionTopic: string;
    scheduledAt: string;
    sessionStatus: string;
  };
  totals: {
    enrolled: number;
    preSubmitted: number;
    postSubmitted: number;
    /** Learners with BOTH a submitted PRE and POST attempt. */
    pairedCount: number;
    avgPre: number | null;
    avgPost: number | null;
    /** Mean of per-learner (post - pre) deltas over `pairedCount` — NOT avgPost - avgPre. */
    avgDelta: number | null;
  };
  learners: {
    anonymousId: string;
    preAttemptId: string | null;
    postAttemptId: string | null;
    pre: number | null;
    post: number | null;
    delta: number | null;
  }[];
  questions: {
    position: number;
    prompt: string;
    pre: { answered: number; correct: number; correctRate: number | null };
    post: { answered: number; correct: number; correctRate: number | null };
    deltaRate: number | null;
  }[];
}

/**
 * Aggregates one session test's PRE vs POST results. Returns null if the test
 * does not exist. Double-blind: learner rows carry `anonymousId` + opaque
 * attempt ids only — never `learner.id` or tutor identity.
 */
export async function buildSessionTestResults(sessionTestId: string): Promise<SessionTestResults | null> {
  const test = await prisma.sessionTest.findUnique({
    where: { id: sessionTestId },
    include: {
      session: {
        select: {
          topic: true,
          scheduledAt: true,
          status: true,
          class: {
            select: {
              code: true,
              subject: true,
              enrollments: { include: { learner: { select: { id: true, anonymousId: true } } } },
            },
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

  const preByLearner = new Map(test.attempts.filter((a) => a.kind === "PRE").map((a) => [a.learnerId, a]));
  const postByLearner = new Map(test.attempts.filter((a) => a.kind === "POST").map((a) => [a.learnerId, a]));

  const learners = test.session.class.enrollments
    .map((e) => e.learner)
    .sort((a, b) => a.anonymousId.localeCompare(b.anonymousId))
    .map((l) => {
      const pre = preByLearner.get(l.id) ?? null;
      const post = postByLearner.get(l.id) ?? null;
      const preScore = pre ? pre.scorePercent : null;
      const postScore = post ? post.scorePercent : null;
      const delta = preScore != null && postScore != null ? postScore - preScore : null;
      return {
        anonymousId: l.anonymousId,
        preAttemptId: pre?.id ?? null,
        postAttemptId: post?.id ?? null,
        pre: preScore,
        post: postScore,
        delta,
      };
    });

  const preScores = learners.filter((l) => l.pre != null).map((l) => l.pre!);
  const postScores = learners.filter((l) => l.post != null).map((l) => l.post!);
  const deltas = learners.filter((l) => l.delta != null).map((l) => l.delta!);

  const questions = test.questions.map((link) => {
    const rateOf = (byLearner: typeof preByLearner) => {
      let answered = 0;
      let correct = 0;
      for (const attempt of byLearner.values()) {
        const item = attempt.items.find((i) => i.position === link.position);
        if (!item || item.isCorrect == null) continue;
        answered++;
        if (item.isCorrect) correct++;
      }
      return { answered, correct, correctRate: answered ? Math.round((correct / answered) * 100) : null };
    };
    const pre = rateOf(preByLearner);
    const post = rateOf(postByLearner);
    const deltaRate =
      pre.correctRate != null && post.correctRate != null ? post.correctRate - pre.correctRate : null;
    return { position: link.position, prompt: link.question.prompt, pre, post, deltaRate };
  });

  return {
    test: {
      id: test.id,
      title: test.title,
      status: test.status,
      classCode: test.session.class.code,
      subject: test.session.class.subject,
      sessionTopic: test.session.topic,
      scheduledAt: test.session.scheduledAt.toISOString(),
      sessionStatus: test.session.status,
    },
    totals: {
      enrolled: test.session.class.enrollments.length,
      preSubmitted: preScores.length,
      postSubmitted: postScores.length,
      pairedCount: deltas.length,
      avgPre: avg(preScores),
      avgPost: avg(postScores),
      avgDelta: avg(deltas),
    },
    learners,
    questions,
  };
}

// ─── Class roll-up — chart (a) pre-vs-post per session ─────────────────────

export interface ClassSessionTestRollupRow {
  sessionId: string;
  sessionTestId: string | null;
  scheduledAt: string;
  topic: string;
  sessionStatus: string;
  testStatus: string | null;
  avgPre: number | null;
  avgPost: number | null;
  avgDelta: number | null;
  pairedCount: number;
}

export interface ClassSessionTestRollup {
  classCode: string;
  sessions: ClassSessionTestRollupRow[];
  totals: {
    /** Mean of per-learner deltas across every session's paired learners. */
    avgDelta: number | null;
    pairedCount: number;
  };
}

/**
 * One row per session in the class. A session with no test at all is a gap
 * (`sessionTestId: null`, every average `null`) — never a fake zero, so the
 * chart can distinguish "no test" from "test with a 0% average."
 */
export async function buildClassSessionTestRollup(classId: string): Promise<ClassSessionTestRollup | null> {
  const tutorClass = await prisma.tutorClass.findUnique({
    where: { id: classId },
    select: {
      code: true,
      sessions: {
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          topic: true,
          scheduledAt: true,
          status: true,
          test: {
            select: {
              id: true,
              status: true,
              attempts: {
                where: { status: "SUBMITTED" },
                select: { learnerId: true, kind: true, scorePercent: true },
              },
            },
          },
        },
      },
    },
  });
  if (!tutorClass) return null;

  const allDeltas: number[] = [];

  const sessions: ClassSessionTestRollupRow[] = tutorClass.sessions.map((s) => {
    if (!s.test) {
      return {
        sessionId: s.id,
        sessionTestId: null,
        scheduledAt: s.scheduledAt.toISOString(),
        topic: s.topic,
        sessionStatus: s.status,
        testStatus: null,
        avgPre: null,
        avgPost: null,
        avgDelta: null,
        pairedCount: 0,
      };
    }

    const pre = new Map(
      s.test.attempts.filter((a) => a.kind === "PRE").map((a) => [a.learnerId, a.scorePercent]),
    );
    const post = new Map(
      s.test.attempts.filter((a) => a.kind === "POST").map((a) => [a.learnerId, a.scorePercent]),
    );
    const sessionDeltas: number[] = [];
    for (const [learnerId, preScore] of pre) {
      const postScore = post.get(learnerId);
      if (postScore != null) sessionDeltas.push(postScore - preScore);
    }
    allDeltas.push(...sessionDeltas);

    return {
      sessionId: s.id,
      sessionTestId: s.test.id,
      scheduledAt: s.scheduledAt.toISOString(),
      topic: s.topic,
      sessionStatus: s.status,
      testStatus: s.test.status,
      avgPre: avg([...pre.values()]),
      avgPost: avg([...post.values()]),
      avgDelta: avg(sessionDeltas),
      pairedCount: sessionDeltas.length,
    };
  });

  return {
    classCode: tutorClass.code,
    sessions,
    totals: { avgDelta: avg(allDeltas), pairedCount: allDeltas.length },
  };
}
