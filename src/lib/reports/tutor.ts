import { prisma } from "@/lib/prisma";
import { avg, dateCell, humanize, rangeLabel, signed, subjectLabel } from "@/lib/reports/format";
import { inRange, type ReportRange } from "@/lib/reports/range";
import type { ReportModel } from "@/lib/reports/types";

type Attempt = { learnerId: string; kind: "PRE" | "POST"; scorePercent: number };

/** Per-session PRE/POST maps keyed by learner, plus paired deltas. */
function scoreSession(attempts: Attempt[]) {
  const pre = new Map(attempts.filter((a) => a.kind === "PRE").map((a) => [a.learnerId, a.scorePercent]));
  const post = new Map(attempts.filter((a) => a.kind === "POST").map((a) => [a.learnerId, a.scorePercent]));
  const deltas = [...pre].flatMap(([id, p]) => (post.has(id) ? [post.get(id)! - p] : []));
  return { pre, post, deltas };
}

const submittedAttempts = { where: { status: "SUBMITTED" as const }, select: { learnerId: true, kind: true, scorePercent: true } };

/**
 * One class the tutor owns (ownership checked by the caller). Learners appear
 * by anonymousId only — never name, email or user id.
 */
export async function buildTutorClassReport(classId: string, range: ReportRange): Promise<ReportModel | null> {
  const cls = await prisma.tutorClass.findUnique({
    where: { id: classId },
    select: {
      code: true, subject: true, gradeLevel: true, status: true, createdAt: true, completedAt: true,
      sessions: {
        where: { scheduledAt: inRange(range) },
        orderBy: { scheduledAt: "asc" },
        select: { topic: true, scheduledAt: true, status: true, test: { select: { status: true, attempts: submittedAttempts } } },
      },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        select: { learnerId: true, enrolledAt: true, withdrawnAt: true, learner: { select: { anonymousId: true } } },
      },
    },
  });
  if (!cls) return null;

  const perLearner = new Map<string, { pre: number[]; post: number[]; deltas: number[] }>();
  const bucket = (id: string) => perLearner.get(id) ?? perLearner.set(id, { pre: [], post: [], deltas: [] }).get(id)!;
  const allDeltas: number[] = [];

  const sessionRows = cls.sessions.map((s) => {
    const published = s.test && s.test.status !== "DRAFT" ? s.test : null;
    const scored = scoreSession((published?.attempts ?? []) as Attempt[]);
    for (const [id, p] of scored.pre) bucket(id).pre.push(p);
    for (const [id, p] of scored.post) {
      bucket(id).post.push(p);
      if (scored.pre.has(id)) bucket(id).deltas.push(p - scored.pre.get(id)!);
    }
    allDeltas.push(...scored.deltas);
    return {
      date: dateCell(s.scheduledAt),
      topic: s.topic,
      status: humanize(s.status),
      test: s.test ? humanize(s.test.status) : "No test",
      preCount: scored.pre.size,
      postCount: scored.post.size,
      avgPre: avg([...scored.pre.values()]),
      avgPost: avg([...scored.post.values()]),
      gain: signed(avg(scored.deltas)),
    };
  });

  const active = cls.enrollments.filter((e) => !e.withdrawnAt).length;

  return {
    title: "Class Report",
    filenameBase: `katuwang-class-report-${cls.code}`,
    meta: [
      { label: "Class", value: `${cls.code} · ${subjectLabel(cls.subject)}` },
      { label: "Grade level", value: cls.gradeLevel ? humanize(cls.gradeLevel) : "Any" },
      { label: "Class status", value: humanize(cls.status) },
      { label: "Period", value: rangeLabel(range) },
    ],
    summary: [
      { label: "Active learners", value: active },
      { label: "Withdrawn learners", value: cls.enrollments.length - active },
      { label: "Sessions in period", value: cls.sessions.length },
      { label: "Sessions completed", value: cls.sessions.filter((s) => s.status === "COMPLETED").length },
      { label: "Paired pre/post attempts", value: allDeltas.length },
      { label: "Average gain (pts)", value: signed(avg(allDeltas)) },
    ],
    sections: [
      {
        title: "Sessions",
        columns: [
          { key: "date", label: "Date", weight: 1.35 },
          { key: "topic", label: "Topic", weight: 2.2 },
          { key: "status", label: "Session", weight: 1.05 },
          { key: "test", label: "Test", weight: 0.85 },
          { key: "preCount", label: "Pre n", weight: 0.6, align: "right" },
          { key: "postCount", label: "Post n", weight: 0.65, align: "right" },
          { key: "avgPre", label: "Pre %", weight: 0.65, align: "right" },
          { key: "avgPost", label: "Post %", weight: 0.7, align: "right" },
          { key: "gain", label: "Gain", weight: 0.6, align: "right" },
        ],
        rows: sessionRows,
        emptyText: "No sessions scheduled in this period.",
      },
      {
        title: "Roster",
        columns: [
          { key: "learner", label: "Learner", weight: 1.2 },
          { key: "enrolled", label: "Enrolled", weight: 1.1 },
          { key: "withdrawn", label: "Withdrawn", weight: 1.1 },
          { key: "avgPre", label: "Avg pre %", weight: 0.8, align: "right" },
          { key: "avgPost", label: "Avg post %", weight: 0.8, align: "right" },
          { key: "gain", label: "Avg gain", weight: 0.8, align: "right" },
        ],
        rows: [...cls.enrollments]
          .sort((a, b) => a.learner.anonymousId.localeCompare(b.learner.anonymousId))
          .map((e) => {
            const s = perLearner.get(e.learnerId);
            return {
              learner: e.learner.anonymousId,
              enrolled: dateCell(e.enrolledAt),
              withdrawn: dateCell(e.withdrawnAt),
              avgPre: avg(s?.pre ?? []),
              avgPost: avg(s?.post ?? []),
              gain: signed(avg(s?.deltas ?? [])),
            };
          }),
        emptyText: "No learners have enrolled.",
      },
    ],
    generatedAt: new Date(),
  };
}

/** Everything the tutor taught in the period plus their qualification record. */
export async function buildTutorSummaryReport(userId: string, range: ReportRange): Promise<ReportModel | null> {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: {
      user: { select: { anonymousId: true } },
      classes: {
        orderBy: { createdAt: "asc" },
        select: {
          code: true, subject: true, status: true,
          enrollments: { select: { learnerId: true, withdrawnAt: true } },
          sessions: {
            where: { scheduledAt: inRange(range) },
            select: { status: true, test: { select: { status: true, attempts: submittedAttempts } } },
          },
        },
      },
      assessmentAttempts: {
        where: { submittedAt: inRange(range), status: { not: "IN_PROGRESS" } },
        orderBy: { submittedAt: "asc" },
        select: { subject: true, topic: true, attemptNo: true, status: true, scorePercent: true, passPercent: true, submittedAt: true },
      },
      topicCertifications: {
        where: { status: "CERTIFIED" },
        orderBy: [{ subject: "asc" }, { topic: "asc" }],
        select: { subject: true, topic: true, certifiedAt: true, approvalMethod: true },
      },
    },
  });
  if (!profile) return null;

  const allDeltas: number[] = [];
  const learners = new Set<string>();
  const classRows = profile.classes.map((c) => {
    c.enrollments.forEach((e) => learners.add(e.learnerId));
    const deltas = c.sessions.flatMap((s) =>
      s.test && s.test.status !== "DRAFT" ? scoreSession(s.test.attempts as Attempt[]).deltas : [],
    );
    allDeltas.push(...deltas);
    return {
      code: c.code,
      subject: subjectLabel(c.subject),
      status: humanize(c.status),
      active: c.enrollments.filter((e) => !e.withdrawnAt).length,
      sessions: c.sessions.length,
      completed: c.sessions.filter((s) => s.status === "COMPLETED").length,
      gain: signed(avg(deltas)),
    };
  });

  return {
    title: "Tutoring Summary",
    filenameBase: `katuwang-tutor-summary-${profile.user.anonymousId}`,
    meta: [
      { label: "Tutor", value: profile.user.anonymousId },
      { label: "Period", value: rangeLabel(range) },
    ],
    summary: [
      { label: "Classes (all time)", value: profile.classes.length },
      { label: "Learners reached (all time)", value: learners.size },
      { label: "Sessions in period", value: classRows.reduce((n, r) => n + r.sessions, 0) },
      { label: "Sessions completed", value: classRows.reduce((n, r) => n + r.completed, 0) },
      { label: "Average learner gain (pts)", value: signed(avg(allDeltas)) },
      { label: "Quizzes passed in period", value: profile.assessmentAttempts.filter((a) => a.status === "PASSED").length },
      { label: "Certified topics", value: profile.topicCertifications.length },
    ],
    sections: [
      {
        title: "Classes",
        columns: [
          { key: "code", label: "Class", weight: 1 },
          { key: "subject", label: "Subject", weight: 1.8 },
          { key: "status", label: "Status", weight: 1 },
          { key: "active", label: "Active learners", weight: 0.9, align: "right" },
          { key: "sessions", label: "Sessions", weight: 0.8, align: "right" },
          { key: "completed", label: "Completed", weight: 0.8, align: "right" },
          { key: "gain", label: "Avg gain", weight: 0.8, align: "right" },
        ],
        rows: classRows,
        emptyText: "You have not created any classes.",
      },
      {
        title: "Qualification quiz attempts",
        columns: [
          { key: "date", label: "Submitted", weight: 1.1 },
          { key: "subject", label: "Subject", weight: 1.5 },
          { key: "topic", label: "Topic", weight: 2.2 },
          { key: "attemptNo", label: "Attempt", weight: 0.7, align: "right" },
          { key: "score", label: "Score %", weight: 0.7, align: "right" },
          { key: "pass", label: "Pass %", weight: 0.7, align: "right" },
          { key: "result", label: "Result", weight: 0.8 },
        ],
        rows: profile.assessmentAttempts.map((a) => ({
          date: dateCell(a.submittedAt),
          subject: subjectLabel(a.subject),
          topic: a.topic,
          attemptNo: a.attemptNo,
          score: a.scorePercent,
          pass: a.passPercent,
          result: humanize(a.status),
        })),
        emptyText: "No quiz attempts submitted in this period.",
      },
      {
        title: "Certified topics",
        columns: [
          { key: "subject", label: "Subject", weight: 1.5 },
          { key: "topic", label: "Topic", weight: 2.5 },
          { key: "certified", label: "Certified", weight: 1.1 },
          { key: "method", label: "Method", weight: 1.2 },
        ],
        rows: profile.topicCertifications.map((c) => ({
          subject: subjectLabel(c.subject),
          topic: c.topic,
          certified: dateCell(c.certifiedAt),
          method: humanize(c.approvalMethod),
        })),
        emptyText: "No certified topics yet.",
      },
    ],
    generatedAt: new Date(),
  };
}
