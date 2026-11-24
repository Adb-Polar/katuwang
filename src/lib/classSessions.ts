import { prisma } from "@/lib/prisma";
import { MINUTE_MS } from "@/lib/datetime";
import { MAX_SESSION_MINUTES } from "@/lib/sessionTime";
import { findOverlap, hasPairwiseOverlap, type TimedRange } from "@/lib/timeRanges";

/**
 * Checks a candidate session's time range against every SCHEDULED session in
 * every SCHEDULED class the tutor owns (excluding, optionally, one session —
 * used when rescheduling that same session).
 */
export async function hasSessionOverlap(
  tutorProfileId: string,
  start: Date,
  end: Date,
  excludeSessionId?: string
): Promise<boolean> {
  const otherSessions = await prisma.classSession.findMany({
    where: {
      status: "SCHEDULED",
      class: { tutorProfileId, status: "SCHEDULED" },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    select: { scheduledAt: true, duration: true },
  });

  const duration = (end.getTime() - start.getTime()) / MINUTE_MS;
  return findOverlap({ scheduledAt: start, duration }, otherSessions) !== undefined;
}

/** Checks a batch of not-yet-created sessions against each other for overlaps. */
export function hasInternalOverlap(sessions: { scheduledAt: Date; duration: number }[]): boolean {
  return hasPairwiseOverlap(sessions);
}

/** A session in another class the learner is enrolled in that clashes with a new one. */
export interface LearnerScheduleConflict {
  classCode: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
}

/**
 * Checks the sessions of a class a learner wants to join against every
 * upcoming SCHEDULED session of the SCHEDULED classes they are already
 * enrolled in. Returns the first clash so the caller can name it.
 */
export async function findLearnerScheduleConflict(
  learnerId: string,
  classId: string,
  candidateSessions: TimedRange[]
): Promise<LearnerScheduleConflict | null> {
  if (candidateSessions.length === 0) return null;

  const enrolledSessions = await prisma.classSession.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: new Date(Date.now() - MAX_SESSION_MINUTES * MINUTE_MS) },
      classId: { not: classId },
      class: { status: "SCHEDULED", enrollments: { some: { learnerId } } },
    },
    select: { scheduledAt: true, duration: true, class: { select: { code: true, subject: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  for (const candidate of candidateSessions) {
    const clash = findOverlap(candidate, enrolledSessions);
    if (clash) {
      return {
        classCode: clash.class.code,
        subject: clash.class.subject,
        scheduledAt: clash.scheduledAt,
        duration: clash.duration,
      };
    }
  }
  return null;
}
