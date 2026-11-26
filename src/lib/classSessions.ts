import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { MINUTE_MS } from "@/lib/datetime";
import { rangesOverlap } from "@/lib/sessionOverlap";

export interface LearnerSessionConflict {
  classCode: string;
  subject: string;
  scheduledAt: Date;
}

/**
 * The first session, in a class the learner is already enrolled in, that overlaps one of
 * `sessions`; null when the schedule is clear.
 * Call while holding the learner's account lock to serialize enrollment attempts.
 */
export async function findLearnerSessionConflict(
  learnerId: string,
  classId: string,
  sessions: { status: string; scheduledAt: Date; duration: number }[],
  db: Pick<Prisma.TransactionClient, "classSession"> = prisma,
): Promise<LearnerSessionConflict | null> {
  const enrolledSessions = await db.classSession.findMany({
    where: {
      status: "SCHEDULED",
      class: {
        id: { not: classId },
        // Suspended classes keep their reservation until cancelled or completed.
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        enrollments: { some: { learnerId, withdrawnAt: null } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    select: { scheduledAt: true, duration: true, class: { select: { code: true, subject: true } } },
  });
  const candidates = sessions.filter((s) => s.status === "SCHEDULED");
  const conflict = enrolledSessions.find((other) =>
    candidates.some((candidate) => rangesOverlap(candidate.scheduledAt, candidate.duration, other.scheduledAt, other.duration))
  );
  return conflict
    ? { classCode: conflict.class.code, subject: conflict.class.subject, scheduledAt: conflict.scheduledAt }
    : null;
}

/**
 * Checks a candidate session's time range against every SCHEDULED session in
 * every non-cancelled/non-completed class the tutor owns (excluding, optionally, one session —
 * used when rescheduling that same session).
 */
export async function hasSessionOverlap(
  tutorProfileId: string,
  start: Date,
  end: Date,
  excludeSessionId?: string,
  db: Pick<Prisma.TransactionClient, "classSession"> = prisma,
): Promise<boolean> {
  const otherSessions = await db.classSession.findMany({
    where: {
      status: "SCHEDULED",
      // Moderation keeps the reservation, so reinstatement cannot create overlaps.
      class: { tutorProfileId, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    select: { scheduledAt: true, duration: true },
  });

  const minutes = (end.getTime() - start.getTime()) / MINUTE_MS;
  return otherSessions.some((s) => rangesOverlap(start, minutes, s.scheduledAt, s.duration));
}

/** Checks a batch of not-yet-created sessions against each other for overlaps. */
export function hasInternalOverlap(sessions: { scheduledAt: Date; duration: number }[]): boolean {
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (rangesOverlap(sessions[i].scheduledAt, sessions[i].duration, sessions[j].scheduledAt, sessions[j].duration)) return true;
    }
  }
  return false;
}
