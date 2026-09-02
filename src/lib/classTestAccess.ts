import { prisma } from "@/lib/prisma";

export type AccessError = { error: string; status: number };

export function isAccessError(x: unknown): x is AccessError {
  return typeof x === "object" && x !== null && "error" in x && "status" in x;
}

/** Resolve the caller's tutor profile and assert they own `classId`. */
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
  return { tutorProfile, tutorClass };
}

/** Class ownership + the test must belong to that class. */
export async function loadOwnedTest(
  userId: string,
  classId: string,
  testId: string
) {
  const owned = await loadOwnedClass(userId, classId);
  if (isAccessError(owned)) return owned;

  const test = await prisma.classTest.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { question: { include: { options: { orderBy: { position: "asc" } } } } },
      },
    },
  });
  if (!test || test.classId !== classId) {
    return { error: "Test not found.", status: 404 } as AccessError;
  }
  return { ...owned, test };
}

/** Assert the caller (a learner) is enrolled in `classId`. */
export async function loadEnrolledClass(userId: string, classId: string) {
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
  return { tutorClass };
}
