import { isQualificationAttemptEligible } from "@/lib/qualificationBank";
import type { Prisma } from "@prisma/client";

/** The persisted score must meet the attempt's own threshold, not today's setting. */
export async function findPassingQualification(
  db: Prisma.TransactionClient,
  certification: { tutorProfileId: string; subject: string; topic: string },
) {
  const attempts = await db.assessmentAttempt.findMany({
    where: { ...certificationScope(certification), certificationEligible: true, status: "PASSED", submittedAt: { not: null }, questionCount: { gt: 0 } },
    include: { items: { select: { questionId: true } } },
    orderBy: { submittedAt: "desc" },
  });
  for (const attempt of attempts) {
    if (attempt.scorePercent >= attempt.passPercent && await isQualificationAttemptEligible(db, attempt)) return attempt;
  }
  return null;
}

function certificationScope({ tutorProfileId, subject, topic }: { tutorProfileId: string; subject: string; topic: string }) {
  return { tutorProfileId, subject, topic };
}
