import { prisma } from "@/lib/prisma";
import { avg, dateCell, humanize, rangeLabel, signed, subjectLabel } from "@/lib/reports/format";
import { inRange, type ReportRange } from "@/lib/reports/range";
import type { ReportModel, ReportSection } from "@/lib/reports/types";
import type { ADMIN_REPORT_SCOPES } from "@/lib/validations/reports";

export type AdminReportScope = (typeof ADMIN_REPORT_SCOPES)[number];

/** Row cap per export; anything beyond is flagged in the section note. */
export const ADMIN_REPORT_MAX_ROWS = 5000;

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();
const capped = (n: number) => (n > ADMIN_REPORT_MAX_ROWS ? `Showing the first ${ADMIN_REPORT_MAX_ROWS} of ${n} records. Narrow the date range to see the rest.` : undefined);

const TITLES: Record<AdminReportScope, string> = {
  overview: "Platform Report",
  users: "Users Export",
  classes: "Classes Export",
  enrollments: "Enrollments Export",
  "session-tests": "Session Tests Export",
  certifications: "Topic Certifications Export",
  "audit-log": "Audit Log Export",
};

const countSection = (title: string, label: string, rows: { key: string; count: number }[]): ReportSection => ({
  title,
  columns: [{ key: "key", label, weight: 3 }, { key: "count", label: "Count", weight: 1, align: "right" }],
  rows: rows.sort((a, b) => b.count - a.count),
  emptyText: "None in this period.",
});

async function overview(range: ReportRange) {
  const r = inRange(range);
  const [byRole, byGrade, byStatus, classBySubject, classByStatus, certByStatus, enrollments, withdrawn, sessionsByStatus, attempts, totalUsers, totalClasses] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], where: { createdAt: r }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["gradeLevel"], where: { createdAt: r, role: { in: ["STUDENT_LEARNER", "STUDENT_TUTOR"] } }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["status"], where: { createdAt: r }, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["subject"], where: { createdAt: r }, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["status"], where: { createdAt: r }, _count: { _all: true } }),
      prisma.topicCertification.groupBy({ by: ["status"], where: { requestedAt: r }, _count: { _all: true } }),
      prisma.classEnrollment.count({ where: { enrolledAt: r } }),
      prisma.classEnrollment.count({ where: { withdrawnAt: r } }),
      prisma.classSession.groupBy({ by: ["status"], where: { scheduledAt: r }, _count: { _all: true } }),
      prisma.sessionTestAttempt.findMany({
        where: { status: "SUBMITTED", submittedAt: r },
        select: { sessionTestId: true, learnerId: true, kind: true, scorePercent: true },
      }),
      prisma.user.count(),
      prisma.tutorClass.count(),
    ]);

  const pre = new Map(attempts.filter((a) => a.kind === "PRE").map((a) => [`${a.sessionTestId}:${a.learnerId}`, a.scorePercent]));
  const deltas = attempts
    .filter((a) => a.kind === "POST" && pre.has(`${a.sessionTestId}:${a.learnerId}`))
    .map((a) => a.scorePercent - pre.get(`${a.sessionTestId}:${a.learnerId}`)!);
  const newUsers = byStatus.reduce((n, g) => n + g._count._all, 0);
  const newClasses = classByStatus.reduce((n, g) => n + g._count._all, 0);

  return {
    summary: [
      { label: "Users (all time)", value: totalUsers },
      { label: "Classes (all time)", value: totalClasses },
      { label: "New users in period", value: newUsers },
      { label: "New classes in period", value: newClasses },
      { label: "Enrollments in period", value: enrollments },
      { label: "Withdrawals in period", value: withdrawn },
      { label: "Test attempts submitted", value: attempts.length },
      { label: "Average pre→post gain (pts)", value: signed(avg(deltas)) },
    ],
    sections: [
      countSection("New users by role", "Role", byRole.map((g) => ({ key: humanize(g.role), count: g._count._all }))),
      countSection("New students by grade level", "Grade level", byGrade.map((g) => ({ key: humanize(g.gradeLevel), count: g._count._all }))),
      countSection("New users by account status", "Status", byStatus.map((g) => ({ key: humanize(g.status), count: g._count._all }))),
      countSection("New classes by subject", "Subject", classBySubject.map((g) => ({ key: subjectLabel(g.subject), count: g._count._all }))),
      countSection("New classes by status", "Status", classByStatus.map((g) => ({ key: humanize(g.status), count: g._count._all }))),
      countSection("Sessions scheduled by status", "Status", sessionsByStatus.map((g) => ({ key: humanize(g.status), count: g._count._all }))),
      countSection("Certification requests by status", "Status", certByStatus.map((g) => ({ key: humanize(g.status), count: g._count._all }))),
    ],
  };
}

async function users(range: ReportRange): Promise<ReportSection> {
  const where = { createdAt: inRange(range) };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { createdAt: "asc" }, take: ADMIN_REPORT_MAX_ROWS,
      select: { anonymousId: true, firstName: true, lastName: true, email: true, role: true, gradeLevel: true, section: true, status: true, createdAt: true },
    }),
  ]);
  return {
    title: "Users registered in period",
    columns: [
      { key: "id", label: "Anonymous ID", weight: 1 },
      { key: "name", label: "Name", weight: 1.6 },
      { key: "email", label: "Email", weight: 2 },
      { key: "role", label: "Role", weight: 1.1 },
      { key: "grade", label: "Grade", weight: 0.8 },
      { key: "section", label: "School section", weight: 0.9 },
      { key: "status", label: "Status", weight: 0.8 },
      { key: "created", label: "Registered", weight: 1 },
    ],
    rows: rows.map((u) => ({
      id: u.anonymousId, name: fullName(u), email: u.email, role: humanize(u.role), grade: humanize(u.gradeLevel),
      section: u.section, status: humanize(u.status), created: dateCell(u.createdAt),
    })),
    note: capped(total),
  };
}

async function classes(range: ReportRange): Promise<ReportSection> {
  const where = { createdAt: inRange(range) };
  const [total, rows] = await Promise.all([
    prisma.tutorClass.count({ where }),
    prisma.tutorClass.findMany({
      where, orderBy: { createdAt: "asc" }, take: ADMIN_REPORT_MAX_ROWS,
      select: {
        code: true, subject: true, gradeLevel: true, status: true, published: true, maxStudents: true, createdAt: true, completedAt: true,
        tutorProfile: { select: { user: { select: { anonymousId: true, firstName: true, lastName: true } } } },
        _count: { select: { enrollments: { where: { withdrawnAt: null } }, sessions: true } },
      },
    }),
  ]);
  return {
    title: "Classes created in period",
    columns: [
      { key: "code", label: "Class", weight: 0.9 },
      { key: "subject", label: "Subject", weight: 1.4 },
      { key: "grade", label: "Grade", weight: 0.8 },
      { key: "tutor", label: "Tutor", weight: 1.8 },
      { key: "status", label: "Status", weight: 0.9 },
      { key: "learners", label: "Learners", weight: 0.8, align: "right" },
      { key: "sessions", label: "Sessions", weight: 0.7, align: "right" },
      { key: "created", label: "Created", weight: 1 },
      { key: "completed", label: "Completed", weight: 1 },
    ],
    rows: rows.map((c) => {
      const t = c.tutorProfile.user;
      return {
        code: c.code, subject: subjectLabel(c.subject), grade: c.gradeLevel ? humanize(c.gradeLevel) : "Any",
        tutor: `${t.anonymousId} · ${fullName(t)}`, status: humanize(c.status) + (c.published ? "" : " (unpublished)"),
        learners: `${c._count.enrollments}/${c.maxStudents}`, sessions: c._count.sessions,
        created: dateCell(c.createdAt), completed: dateCell(c.completedAt),
      };
    }),
    note: capped(total),
  };
}

async function enrollments(range: ReportRange): Promise<ReportSection> {
  const where = { enrolledAt: inRange(range) };
  const [total, rows] = await Promise.all([
    prisma.classEnrollment.count({ where }),
    prisma.classEnrollment.findMany({
      where, orderBy: { enrolledAt: "asc" }, take: ADMIN_REPORT_MAX_ROWS,
      select: {
        enrolledAt: true, withdrawnAt: true,
        class: { select: { code: true, subject: true } },
        learner: { select: { anonymousId: true, firstName: true, lastName: true, gradeLevel: true } },
      },
    }),
  ]);
  return {
    title: "Enrollments in period",
    columns: [
      { key: "enrolled", label: "Enrolled", weight: 1 },
      { key: "code", label: "Class", weight: 0.9 },
      { key: "subject", label: "Subject", weight: 1.5 },
      { key: "learner", label: "Learner", weight: 2 },
      { key: "grade", label: "Grade", weight: 0.8 },
      { key: "withdrawn", label: "Withdrawn", weight: 1 },
    ],
    rows: rows.map((e) => ({
      enrolled: dateCell(e.enrolledAt), code: e.class.code, subject: subjectLabel(e.class.subject),
      learner: `${e.learner.anonymousId} · ${fullName(e.learner)}`, grade: humanize(e.learner.gradeLevel), withdrawn: dateCell(e.withdrawnAt),
    })),
    note: capped(total),
  };
}

async function sessionTests(range: ReportRange): Promise<ReportSection> {
  const where = { session: { scheduledAt: inRange(range) } };
  const [total, rows] = await Promise.all([
    prisma.sessionTest.count({ where }),
    prisma.sessionTest.findMany({
      where, orderBy: { session: { scheduledAt: "asc" } }, take: ADMIN_REPORT_MAX_ROWS,
      select: {
        status: true,
        session: { select: { topic: true, scheduledAt: true, class: { select: { code: true, subject: true } } } },
        attempts: { where: { status: "SUBMITTED" }, select: { learnerId: true, kind: true, scorePercent: true } },
      },
    }),
  ]);
  return {
    title: "Session tests in period",
    columns: [
      { key: "date", label: "Session date", weight: 1.35 },
      { key: "code", label: "Class", weight: 0.8 },
      { key: "subject", label: "Subject", weight: 1.2 },
      { key: "topic", label: "Topic", weight: 1.9 },
      { key: "status", label: "Test", weight: 0.75 },
      { key: "preN", label: "Pre n", weight: 0.6, align: "right" },
      { key: "postN", label: "Post n", weight: 0.65, align: "right" },
      { key: "avgPre", label: "Pre %", weight: 0.65, align: "right" },
      { key: "avgPost", label: "Post %", weight: 0.7, align: "right" },
      { key: "gain", label: "Gain", weight: 0.6, align: "right" },
    ],
    rows: rows.map((t) => {
      const pre = new Map(t.attempts.filter((a) => a.kind === "PRE").map((a) => [a.learnerId, a.scorePercent]));
      const post = t.attempts.filter((a) => a.kind === "POST");
      const deltas = post.flatMap((a) => (pre.has(a.learnerId) ? [a.scorePercent - pre.get(a.learnerId)!] : []));
      return {
        date: dateCell(t.session.scheduledAt), code: t.session.class.code, subject: subjectLabel(t.session.class.subject),
        topic: t.session.topic, status: humanize(t.status), preN: pre.size, postN: post.length,
        avgPre: avg([...pre.values()]), avgPost: avg(post.map((a) => a.scorePercent)), gain: signed(avg(deltas)),
      };
    }),
    note: capped(total),
  };
}

async function certifications(range: ReportRange): Promise<ReportSection> {
  const where = { requestedAt: inRange(range) };
  const [total, rows] = await Promise.all([
    prisma.topicCertification.count({ where }),
    prisma.topicCertification.findMany({
      where, orderBy: { requestedAt: "asc" }, take: ADMIN_REPORT_MAX_ROWS,
      select: {
        subject: true, topic: true, status: true, approvalMethod: true, requestedAt: true, certifiedAt: true,
        tutorProfile: { select: { user: { select: { anonymousId: true, firstName: true, lastName: true } } } },
      },
    }),
  ]);
  return {
    title: "Topic certification requests in period",
    columns: [
      { key: "requested", label: "Requested", weight: 1 },
      { key: "tutor", label: "Tutor", weight: 1.8 },
      { key: "subject", label: "Subject", weight: 1.3 },
      { key: "topic", label: "Topic", weight: 2 },
      { key: "status", label: "Status", weight: 0.9 },
      { key: "method", label: "Method", weight: 0.9 },
      { key: "certified", label: "Certified", weight: 1 },
    ],
    rows: rows.map((c) => {
      const t = c.tutorProfile.user;
      return {
        requested: dateCell(c.requestedAt), tutor: `${t.anonymousId} · ${fullName(t)}`, subject: subjectLabel(c.subject),
        topic: c.topic, status: humanize(c.status), method: humanize(c.approvalMethod), certified: dateCell(c.certifiedAt),
      };
    }),
    note: capped(total),
  };
}

async function auditLog(range: ReportRange): Promise<ReportSection> {
  const where = { createdAt: inRange(range) };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where, orderBy: { createdAt: "asc" }, take: ADMIN_REPORT_MAX_ROWS,
      select: { action: true, targetType: true, targetId: true, reason: true, createdAt: true, admin: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  return {
    title: "Moderation actions in period",
    columns: [
      { key: "date", label: "Date", weight: 1 },
      { key: "admin", label: "Admin", weight: 1.4 },
      { key: "action", label: "Action", weight: 1.5 },
      { key: "target", label: "Target", weight: 1 },
      { key: "targetId", label: "Target ID", weight: 1.5 },
      { key: "reason", label: "Reason", weight: 2.4 },
    ],
    rows: rows.map((a) => ({
      date: dateCell(a.createdAt), admin: fullName(a.admin), action: humanize(a.action),
      target: humanize(a.targetType), targetId: a.targetId, reason: a.reason ?? "",
    })),
    note: capped(total),
  };
}

const SECTION_BUILDERS: Record<Exclude<AdminReportScope, "overview">, (r: ReportRange) => Promise<ReportSection>> = {
  users, classes, enrollments, "session-tests": sessionTests, certifications, "audit-log": auditLog,
};

/** Admin-only: may include real names/emails (admins already see them in the portal). */
export async function buildAdminReport(scope: AdminReportScope, range: ReportRange): Promise<ReportModel> {
  const meta = [{ label: "Scope", value: TITLES[scope] }, { label: "Period", value: rangeLabel(range) }];
  const base = { title: TITLES[scope], filenameBase: `katuwang-admin-${scope}`, meta, generatedAt: new Date() };
  if (scope === "overview") return { ...base, ...(await overview(range)) };
  const section = await SECTION_BUILDERS[scope](range);
  return { ...base, summary: [{ label: "Records", value: section.rows.length }], sections: [section] };
}
