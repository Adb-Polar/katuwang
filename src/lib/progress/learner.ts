import { prisma } from "@/lib/prisma";
import { avg } from "@/lib/reports/format";

export interface LearnerProgressRow {
  classCode: string;
  withdrawnAt: string | null;
  subject: string;
  topic: string;
  scheduledAt: string;
  preScore: number | null;
  postScore: number | null;
  delta: number | null;
}

export interface LearnerProgress {
  series: LearnerProgressRow[];
  summary: { sessionsWithTest: number; pairedCount: number; avgDelta: number | null };
  enrollments: { classCode: string; subject: string; classStatus: string; withdrawnAt: Date | null }[];
}

/**
 * The learner's own PRE/POST scores per published session test.
 * Double-blind: no tutor identity, no cohort/class-average stats (a 1-on-1 or
 * small class would make "class average" a de-anonymisation oracle).
 */
export async function getLearnerProgress(
  learnerId: string,
  opts: { classId?: string; scheduledAt?: { gte: Date; lt: Date } } = {},
): Promise<LearnerProgress> {
  const enrollments = await prisma.classEnrollment.findMany({
    where: { learnerId, ...(opts.classId ? { classId: opts.classId } : {}) },
    select: {
      withdrawnAt: true,
      class: {
        select: {
          code: true,
          subject: true,
          status: true,
          sessions: {
            ...(opts.scheduledAt ? { where: { scheduledAt: opts.scheduledAt } } : {}),
            select: {
              id: true,
              topic: true,
              scheduledAt: true,
              status: true,
              test: {
                select: {
                  status: true,
                  attempts: {
                    where: { learnerId },
                    select: { kind: true, scorePercent: true, status: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const series = enrollments
    .flatMap((e) =>
      e.class.sessions
        .filter((s) => s.test && s.test.status !== "DRAFT")
        .map((s) => {
          const submitted = s.test!.attempts.filter((a) => a.status === "SUBMITTED");
          const pre = submitted.find((a) => a.kind === "PRE")?.scorePercent ?? null;
          const post = submitted.find((a) => a.kind === "POST")?.scorePercent ?? null;
          const delta = pre != null && post != null ? post - pre : null;
          return {
            classCode: e.class.code,
            withdrawnAt: e.withdrawnAt?.toISOString() ?? null,
            subject: e.class.subject,
            topic: s.topic,
            scheduledAt: s.scheduledAt.toISOString(),
            preScore: pre,
            postScore: post,
            delta,
          };
        }),
    )
    // Sort in JS — reads through session -> test -> attempts, not a Prisma orderBy path.
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const deltas = series.filter((r) => r.delta != null).map((r) => r.delta!);

  return {
    series,
    summary: { sessionsWithTest: series.length, pairedCount: deltas.length, avgDelta: avg(deltas) },
    enrollments: enrollments.map((e) => ({
      classCode: e.class.code,
      subject: e.class.subject,
      classStatus: e.class.status ?? "",
      withdrawnAt: e.withdrawnAt ?? null,
    })),
  };
}
