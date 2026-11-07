import type { Prisma } from "@prisma/client";

/** The persisted score must meet the attempt's own threshold, not today's setting. */
export async function findPassingQualification(
  db: Prisma.TransactionClient,
  certification: { tutorProfileId: string; subject: string; topic: string },
) {
  const attempts = await db.assessmentAttempt.findMany({
    where: { ...certificationScope(certification), status: "PASSED", submittedAt: { not: null }, questionCount: { gt: 0 } },
    select: { id: true, scorePercent: true, passPercent: true },
    orderBy: { submittedAt: "desc" },
  });
  return attempts.find(attempt => attempt.scorePercent >= attempt.passPercent) ?? null;
}

function certificationScope({ tutorProfileId, subject, topic }: { tutorProfileId: string; subject: string; topic: string }) {
  return { tutorProfileId, subject, topic };
}
