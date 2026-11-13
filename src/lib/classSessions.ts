import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { MINUTE_MS } from "@/lib/datetime";

/** Call while holding the learner's account lock to serialize enrollment attempts. */
export async function hasLearnerSessionOverlap(
  learnerId: string,
  classId: string,
  sessions: { status: string; scheduledAt: Date; duration: number }[],
  db: Pick<Prisma.TransactionClient, "classSession"> = prisma,
): Promise<boolean> {
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
    select: { scheduledAt: true, duration: true },
  });
  return sessions.filter(s => s.status === "SCHEDULED").some(candidate => {
    const start = candidate.scheduledAt.getTime();
    const end = start + candidate.duration * MINUTE_MS;
    return enrolledSessions.some(other => {
      const otherStart = other.scheduledAt.getTime();
      return start < otherStart + other.duration * MINUTE_MS && end > otherStart;
    });
  });
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

  return otherSessions.some((s) => {
    const sStart = s.scheduledAt.getTime();
    const sEnd = sStart + s.duration * MINUTE_MS;
    return start.getTime() < sEnd && end.getTime() > sStart;
  });
}

/** Checks a batch of not-yet-created sessions against each other for overlaps. */
export function hasInternalOverlap(sessions: { scheduledAt: Date; duration: number }[]): boolean {
  for (let i = 0; i < sessions.length; i++) {
    const aStart = sessions[i].scheduledAt.getTime();
    const aEnd = aStart + sessions[i].duration * MINUTE_MS;
    for (let j = i + 1; j < sessions.length; j++) {
      const bStart = sessions[j].scheduledAt.getTime();
      const bEnd = bStart + sessions[j].duration * MINUTE_MS;
      if (aStart < bEnd && aEnd > bStart) return true;
    }
  }
  return false;
}
