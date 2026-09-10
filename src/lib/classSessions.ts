import { prisma } from "@/lib/prisma";
import { MINUTE_MS } from "@/lib/datetime";

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
