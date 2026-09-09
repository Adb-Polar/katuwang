/**
 * Standalone seed — session pre/post-test results, sized to exercise every chart.
 *
 *   pnpm exec tsx prisma/seed-session-tests.ts
 *
 * Run this AFTER `pnpm exec tsx prisma/seed.ts` (it builds on the demo MATH
 * class owned by demo@tutor.test — "Algebraic Expressions" /
 * "Linear Equations & Inequalities"). Re-running is safe: the script wipes and
 * rebuilds this class's sessions, its session tests, and the `[seed-st]`
 * questions it owns; learner enrolments are only ever added.
 *
 * What it produces, and the chart each part feeds:
 *
 *   (a) GroupedBarChart  — tutor class page, "Pre vs post average, by session"
 *       -> 6 sessions: 4 fully paired, 1 pre-only (post bar absent), 1 with no
 *          test at all (gap row, not a fake zero).
 *   (b) ProgressAreaChart — learner "My Progress" (log in as demo@learner.test)
 *       -> that learner has a pre/post point per session incl. a null-post one
 *          and a regression, so the line moves both ways.
 *   (c) RateBarChart     — one session's results, "Per-question correct rate"
 *       -> every test has 6 questions; correctness is spread per question so the
 *          pre/post bars and their delta differ column to column.
 *   (d) DeltaBar         — one session's results, "Per-learner gain (post - pre)"
 *       -> session 2 has positive, negative and exactly-zero deltas; session 3
 *          has unpaired learners (null delta rows).
 *
 * The admin Reports charts (users/classes/certs/enrolments) are fed by the main
 * seed and are not touched here.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: ".env.seed" });

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DEMO_TUTOR_EMAIL = "demo@tutor.test";
const DEMO_LEARNER_EMAIL = "demo@learner.test";
const SUBJECT = "MATH";
const TOPIC_A = "Algebraic Expressions";
const TOPIC_L = "Linear Equations & Inequalities";
const TAG = "[seed-st]"; // marks questions this script owns, for idempotent re-runs
const MAX_ROSTER = 12;

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

// ─── Deterministic RNG so re-runs produce the same scores ───────────────────
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Question pools (6 per topic) — [prompt, [[optionText, isCorrect], ...]] ──
type QSeed = { prompt: string; options: [string, boolean][] };

const POOLS: Record<string, QSeed[]> = {
  [TOPIC_A]: [
    { prompt: "Simplify: 7a - 3a + a", options: [["5a", true], ["4a", false], ["11a", false], ["3a", false]] },
    { prompt: "Factor completely: 6x + 9", options: [["3(2x + 3)", true], ["3(2x + 9)", false], ["6(x + 9)", false], ["3(3x + 2)", false]] },
    { prompt: "Evaluate 5 - 2b when b = -3", options: [["11", true], ["-1", false], ["1", false], ["-11", false]] },
    { prompt: "Write (x)(x)(x) using an exponent.", options: [["x^3", true], ["3x", false], ["x", false], ["x^2", false]] },
    { prompt: "Which expression is 4x - 12 fully factored?", options: [["4(x - 3)", true], ["4(x - 12)", false], ["x(4 - 12)", false], ["4(x + 3)", false]] },
    { prompt: "Combine like terms: 2m + 5n - m + n", options: [["m + 6n", true], ["3m + 6n", false], ["m + 4n", false], ["2m + 6n", false]] },
  ],
  [TOPIC_L]: [
    { prompt: "Solve for x: x + 7 = 12", options: [["5", true], ["19", false], ["-5", false], ["7", false]] },
    { prompt: "Solve: 3x = 21", options: [["7", true], ["18", false], ["24", false], ["63", false]] },
    { prompt: "Solve: 2x - 4 = 10", options: [["7", true], ["3", false], ["6", false], ["5", false]] },
    { prompt: "Which value satisfies x - 5 > 0?", options: [["8", true], ["5", false], ["3", false], ["-1", false]] },
    { prompt: "Solve for x: x / 4 = 3", options: [["12", true], ["7", false], ["0.75", false], ["1", false]] },
    { prompt: "If 5 - x = 2, then x =", options: [["3", true], ["7", false], ["-3", false], ["2", false]] },
  ],
};

// ─── Per-session score design ───────────────────────────────────────────────
// Returns { pre, post } fractions in [0, 1]; post === null means "not taken".
type Plan = { pre: number; post: number | null };
type SessionSpec = {
  key: string;
  title: string;
  topic: string;
  scheduledAt: Date;
  sessionStatus: "SCHEDULED" | "COMPLETED";
  testStatus: "PUBLISHED" | "CLOSED" | null; // null -> no test at all (chart (a) gap)
  /** which enrolled learners attempt it, and how they score */
  plan: (i: number, email: string, total: number) => Plan | null;
};

const SESSIONS: SessionSpec[] = [
  {
    key: "S1",
    title: "Algebraic Expressions — diagnostic 1",
    topic: TOPIC_A,
    scheduledAt: daysAgo(28),
    sessionStatus: "COMPLETED",
    testStatus: "PUBLISHED",
    // Everyone paired, clear improvement across the board.
    plan: (i) => {
      const pre = 0.2 + (i % 4) * 0.1; // 0.20 .. 0.50
      const post = Math.min(1, pre + 0.4 + (i % 3) * 0.05); // +0.40 .. +0.50
      return { pre, post };
    },
  },
  {
    key: "S2",
    title: "Linear Equations — diagnostic",
    topic: TOPIC_L,
    scheduledAt: daysAgo(21),
    sessionStatus: "COMPLETED",
    testStatus: "PUBLISHED",
    // Everyone paired, but deltas span +, - and exactly 0 (feeds DeltaBar).
    plan: (i, email) => {
      if (email === DEMO_LEARNER_EMAIL) return { pre: 0.4, post: 0.9 }; // big gain
      if (i === 1) return { pre: 0.83, post: 0.5 }; // regression (negative delta)
      if (i === 2) return { pre: 0.6, post: 0.6 }; // flat (zero delta)
      const pre = 0.35 + (i % 3) * 0.05;
      return { pre, post: Math.min(1, pre + 0.2) };
    },
  },
  {
    key: "S3",
    title: "Algebraic Expressions — diagnostic 2",
    topic: TOPIC_A,
    scheduledAt: daysAgo(14),
    sessionStatus: "COMPLETED",
    testStatus: "PUBLISHED",
    // All take PRE; only even-index learners take POST -> unpaired (null) rows.
    plan: (i) => {
      const pre = 0.3 + (i % 4) * 0.08;
      const post = i % 2 === 0 ? Math.min(1, pre + 0.3 + (i % 3) * 0.05) : null;
      return { pre, post };
    },
  },
  {
    key: "S4",
    title: "Linear Equations — pre-only checkpoint",
    topic: TOPIC_L,
    scheduledAt: daysAgo(7),
    sessionStatus: "COMPLETED",
    testStatus: "PUBLISHED",
    // PRE for everyone, POST for nobody -> chart (a) post bar/avg is null.
    plan: (i) => ({ pre: 0.3 + (i % 5) * 0.1, post: null }),
  },
  {
    key: "S5",
    title: "Algebraic Expressions — mastery check",
    topic: TOPIC_A,
    scheduledAt: daysAgo(3),
    sessionStatus: "COMPLETED",
    testStatus: "CLOSED",
    // Only the first 3 learners; already-high scores, small gain. Test is CLOSED.
    plan: (i) => {
      if (i > 2) return null;
      const pre = 0.7 + i * 0.05;
      return { pre, post: Math.min(1, pre + 0.1) };
    },
  },
  {
    key: "S6",
    title: "",
    topic: TOPIC_A,
    scheduledAt: daysFromNow(5),
    sessionStatus: "SCHEDULED",
    testStatus: null, // no test -> chart (a) shows a gap, not a zero
    plan: () => null,
  },
];

async function main() {
  // ── Locate the demo class ────────────────────────────────────────────────
  const demoClass = await prisma.tutorClass.findFirst({
    where: {
      subject: SUBJECT,
      tutorProfile: { user: { email: DEMO_TUTOR_EMAIL } },
      topics: { some: { topic: TOPIC_A } },
    },
    include: {
      tutorProfile: { select: { id: true, user: { select: { id: true } } } },
      topics: true,
      enrollments: { select: { learnerId: true } },
    },
  });
  if (!demoClass) {
    console.error(
      `Could not find the demo class (${DEMO_TUTOR_EMAIL}, ${SUBJECT} / "${TOPIC_A}").\n` +
        "Run `pnpm exec tsx prisma/seed.ts` first, then re-run this script.",
    );
    process.exit(1);
  }
  const tutorProfileId = demoClass.tutorProfile.id;
  const tutorUserId = demoClass.tutorProfile.user.id;

  // Make sure both class topics exist (idempotent).
  for (const topic of [TOPIC_A, TOPIC_L]) {
    if (!demoClass.topics.some((t) => t.topic === topic)) {
      await prisma.classTopic.create({ data: { classId: demoClass.id, topic } });
    }
  }

  // ── Roster: keep every existing enrolment, add learners up to MAX_ROSTER ──
  const already = new Set(demoClass.enrollments.map((e) => e.learnerId));
  const learners = await prisma.user.findMany({
    where: { role: "STUDENT_LEARNER" },
    select: { id: true, email: true },
  });
  // demo@learner.test first (so it's learner index 0 everywhere), rest by email.
  learners.sort((a, b) => {
    if (a.email === DEMO_LEARNER_EMAIL) return -1;
    if (b.email === DEMO_LEARNER_EMAIL) return 1;
    return a.email.localeCompare(b.email);
  });
  const roster = learners.slice(0, MAX_ROSTER);
  const toEnroll = roster.filter((l) => !already.has(l.id));
  if (toEnroll.length) {
    await prisma.classEnrollment.createMany({
      data: toEnroll.map((l) => ({ classId: demoClass.id, learnerId: l.id })),
      skipDuplicates: true,
    });
  }
  await prisma.tutorClass.update({
    where: { id: demoClass.id },
    data: { maxStudents: Math.max(demoClass.maxStudents, roster.length), published: true },
  });

  // ── Wipe this class's sessions (cascades to their session tests/attempts) ─
  await prisma.classSession.deleteMany({ where: { classId: demoClass.id } });

  // ── Rebuild the `[seed-st]` question pool (safe now that no test links it) ─
  await prisma.assessmentQuestion.deleteMany({
    where: { ownerTutorProfileId: tutorProfileId, prompt: { startsWith: TAG } },
  });
  const questionsByTopic: Record<string, { id: string; correctOptId: string; wrongOptId: string }[]> = {
    [TOPIC_A]: [],
    [TOPIC_L]: [],
  };
  for (const topic of [TOPIC_A, TOPIC_L]) {
    for (const q of POOLS[topic]) {
      const created = await prisma.assessmentQuestion.create({
        data: {
          subject: SUBJECT,
          topic,
          prompt: `${TAG} ${q.prompt}`,
          explanation: null,
          origin: "TUTOR",
          createdById: tutorUserId,
          ownerTutorProfileId: tutorProfileId,
          options: { create: q.options.map(([text, isCorrect], position) => ({ text, isCorrect, position })) },
        },
        select: { id: true, options: { select: { id: true, isCorrect: true } } },
      });
      questionsByTopic[topic].push({
        id: created.id,
        correctOptId: created.options.find((o) => o.isCorrect)!.id,
        wrongOptId: created.options.find((o) => !o.isCorrect)!.id,
      });
    }
  }

  // ── Build the sessions, their tests, and every learner's attempts ─────────
  let attemptCount = 0;
  let testCount = 0;

  for (let sIdx = 0; sIdx < SESSIONS.length; sIdx++) {
    const spec = SESSIONS[sIdx];
    const session = await prisma.classSession.create({
      data: {
        classId: demoClass.id,
        topic: spec.topic,
        scheduledAt: spec.scheduledAt,
        duration: 60,
        status: spec.sessionStatus,
      },
    });

    if (!spec.testStatus) continue; // S6 — deliberately no test

    const qs = questionsByTopic[spec.topic];
    const test = await prisma.sessionTest.create({
      data: {
        sessionId: session.id,
        title: spec.title,
        instructions: "A short diagnostic before and after this session. Answer as best you can.",
        status: spec.testStatus,
        publishedAt: spec.scheduledAt,
        closedAt: spec.testStatus === "CLOSED" ? daysAgo(1) : null,
        questions: { create: qs.map((q, i) => ({ questionId: q.id, position: i })) },
      },
    });
    testCount++;

    const rng = makeRng(1000 + sIdx * 37);

    for (let i = 0; i < roster.length; i++) {
      const learner = roster[i];
      const plan = spec.plan(i, learner.email, roster.length);
      if (!plan) continue;

      for (const kind of ["PRE", "POST"] as const) {
        const frac = kind === "PRE" ? plan.pre : plan.post;
        if (frac == null) continue;

        const k = Math.round(frac * qs.length);
        const correctIdx = new Set(shuffle([...qs.keys()], rng).slice(0, k));
        const items = qs.map((q, idx) => {
          const isCorrect = correctIdx.has(idx);
          return {
            questionId: q.id,
            position: idx,
            selectedOptionId: isCorrect ? q.correctOptId : q.wrongOptId,
            isCorrect,
          };
        });
        const correctCount = items.filter((it) => it.isCorrect).length;
        await prisma.sessionTestAttempt.create({
          data: {
            sessionTestId: test.id,
            learnerId: learner.id,
            kind,
            status: "SUBMITTED",
            totalQuestions: qs.length,
            correctCount,
            scorePercent: Math.round((correctCount / qs.length) * 100),
            startedAt: spec.scheduledAt,
            submittedAt: spec.scheduledAt,
            items: { create: items },
          },
        });
        attemptCount++;
      }
    }
  }

  console.log("Session-test seed complete.\n");
  console.log(`  Class ............ ${demoClass.code}  (${SUBJECT} — ${TOPIC_A} / ${TOPIC_L})`);
  console.log(`  Roster ........... ${roster.length} learners (demo@learner.test = index 0)`);
  console.log(`  Sessions ......... ${SESSIONS.length}  (${testCount} with a test, 1 pre-only, 1 with none)`);
  console.log(`  Attempts ......... ${attemptCount} submitted PRE/POST attempts`);
  console.log("\nWhere to look:");
  console.log("  (a) tutor  -> /tutor/classes  -> open this class -> Progress panel");
  console.log("  (b) learner-> log in as demo@learner.test -> /learner/progress");
  console.log("  (c)/(d)    -> tutor -> class -> a session's \"View results\" (try session 2 for mixed deltas,");
  console.log("               session 3 for unpaired learners)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
