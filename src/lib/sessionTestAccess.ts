import { prisma } from "@/lib/prisma";

export type AccessError = { error: string; status: number };

export function isAccessError(x: unknown): x is AccessError {
  return typeof x === "object" && x !== null && "error" in x && "status" in x;
}

/**
 * Resolve the caller's tutor profile and assert they own `classId`.
 * A SUSPENDED or BANNED class is treated as not writable (403) — the check is
 * folded in here so every session-test mutation inherits it.
 */
export async function loadOwnedClass(userId: string, classId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) return { error: "Tutor profile not found.", status: 404 } as AccessError;

  const tutorClass = await prisma.tutorClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      tutorProfileId: true,
      status: true,
      subject: true,
      topics: { select: { topic: true } },
    },
  });
  if (!tutorClass) return { error: "Class not found.", status: 404 } as AccessError;
  if (tutorClass.tutorProfileId !== tutorProfile.id) {
    return { error: "Forbidden.", status: 403 } as AccessError;
  }
  if (tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED") {
    return { error: "This class is under moderation.", status: 403 } as AccessError;
  }
  return { tutorProfile, tutorClass };
}

const TEST_INCLUDE = {
  questions: {
    orderBy: { position: "asc" } as const,
    include: { question: { include: { options: { orderBy: { position: "asc" } as const } } } },
  },
  _count: { select: { attempts: true } },
} as const;

/** Class ownership + the session must belong to that class. Test is nullable — it may not exist yet. */
export async function loadOwnedSession(userId: string, classId: string, sessionId: string) {
  const owned = await loadOwnedClass(userId, classId);
  if (isAccessError(owned)) return owned;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { id: true, classId: true, status: true, scheduledAt: true, topic: true },
  });
  if (!session || session.classId !== classId) {
    return { error: "Session not found.", status: 404 } as AccessError;
  }

  const test = await prisma.sessionTest.findUnique({
    where: { sessionId },
    include: TEST_INCLUDE,
  });

  return { ...owned, session, test };
}

/**
 * Assert the caller (a learner) is enrolled in `classId`, the class is not
 * under moderation, and `sessionId` belongs to that class.
 */
export async function loadEnrolledSession(userId: string, classId: string, sessionId: string) {
  const tutorClass = await prisma.tutorClass.findUnique({
    where: { id: classId },
    select: { id: true, status: true },
  });
  if (!tutorClass) return { error: "Class not found.", status: 404 } as AccessError;

  const enrollment = await prisma.classEnrollment.findUnique({
    where: { classId_learnerId: { classId, learnerId: userId } },
    select: { id: true },
  });
  if (!enrollment) {
    return { error: "You are not enrolled in this class.", status: 403 } as AccessError;
  }
  if (tutorClass.status === "SUSPENDED" || tutorClass.status === "BANNED") {
    return { error: "This class is under moderation.", status: 403 } as AccessError;
  }

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { id: true, classId: true, status: true },
  });
  if (!session || session.classId !== classId) {
    return { error: "Session not found.", status: 404 } as AccessError;
  }

  return { tutorClass, session };
}
