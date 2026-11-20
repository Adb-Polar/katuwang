import { prisma } from "@/lib/prisma";
import { getLearnerProgress } from "@/lib/progress/learner";
import { avg, dateCell, humanize, rangeLabel, signed, subjectLabel } from "@/lib/reports/format";
import { inRange, type ReportRange } from "@/lib/reports/range";
import type { ReportModel } from "@/lib/reports/types";

/**
 * The learner's own progress report. Double-blind like the progress view:
 * no tutor identity (certificates are listed without `tutorName`) and no
 * class or cohort averages.
 */
export async function buildLearnerReport(learnerId: string, range: ReportRange, classId?: string): Promise<ReportModel | null> {
  const [me, progress, certificates] = await Promise.all([
    prisma.user.findUnique({ where: { id: learnerId }, select: { anonymousId: true, gradeLevel: true, section: true } }),
    getLearnerProgress(learnerId, { classId, scheduledAt: inRange(range) }),
    prisma.completionCertificate.findMany({
      where: { learnerId, issuedAt: inRange(range), ...(classId ? { classId } : {}) },
      orderBy: { issuedAt: "asc" },
      select: { certificateNumber: true, classCode: true, subjectName: true, completedAt: true },
    }),
  ]);
  if (!me) return null;
  if (classId && progress.enrollments.length === 0) return null;

  const pres = progress.series.flatMap((r) => (r.preScore != null ? [r.preScore] : []));
  const posts = progress.series.flatMap((r) => (r.postScore != null ? [r.postScore] : []));
  const enrolled = progress.enrollments;

  return {
    title: "My Progress Report",
    filenameBase: `katuwang-progress-${me.anonymousId}${classId ? `-${enrolled[0].classCode}` : ""}`,
    meta: [
      { label: "Learner", value: me.anonymousId },
      { label: "Grade / section", value: `${humanize(me.gradeLevel)} · ${me.section}` },
      { label: "Classes", value: classId ? `${enrolled[0].classCode} · ${subjectLabel(enrolled[0].subject)}` : "All classes" },
      { label: "Period", value: rangeLabel(range) },
    ],
    summary: [
      { label: "Classes joined (all time)", value: enrolled.length },
      { label: "Classes completed", value: enrolled.filter((e) => !e.withdrawnAt && e.classStatus === "COMPLETED").length },
      { label: "Classes withdrawn", value: enrolled.filter((e) => e.withdrawnAt).length },
      { label: "Session tests in period", value: progress.summary.sessionsWithTest },
      { label: "Average pre-test %", value: avg(pres) },
      { label: "Average post-test %", value: avg(posts) },
      { label: "Average gain (pts)", value: signed(progress.summary.avgDelta) },
      { label: "Certificates in period", value: certificates.length },
    ],
    sections: [
      {
        title: "Session test scores",
        columns: [
          { key: "date", label: "Date", weight: 1.1 },
          { key: "classCode", label: "Class", weight: 1 },
          { key: "subject", label: "Subject", weight: 1.4 },
          { key: "topic", label: "Topic", weight: 2.4 },
          { key: "pre", label: "Pre %", weight: 0.7, align: "right" },
          { key: "post", label: "Post %", weight: 0.7, align: "right" },
          { key: "delta", label: "Gain", weight: 0.7, align: "right" },
        ],
        rows: progress.series.map((r) => ({
          date: dateCell(r.scheduledAt),
          classCode: r.classCode,
          subject: subjectLabel(r.subject),
          topic: r.topic,
          pre: r.preScore,
          post: r.postScore,
          delta: signed(r.delta),
        })),
        emptyText: "No published session tests in this period.",
      },
      {
        title: "Certificates of completion",
        columns: [
          { key: "number", label: "Certificate no.", weight: 1.5 },
          { key: "classCode", label: "Class", weight: 1 },
          { key: "subject", label: "Subject", weight: 2 },
          { key: "completed", label: "Completed", weight: 1.2 },
        ],
        rows: certificates.map((c) => ({
          number: c.certificateNumber,
          classCode: c.classCode,
          subject: c.subjectName,
          completed: dateCell(c.completedAt),
        })),
        emptyText: "No certificates issued in this period.",
      },
    ],
    generatedAt: new Date(),
  };
}
