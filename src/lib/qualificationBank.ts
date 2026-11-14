import type { Prisma } from "@prisma/client";
import { lockQuestionRows } from "@/lib/questionLocks";

/** Eligibility requires documented qualified review or explicit administrative approval. */
export function qualificationQuestionWhere(scope: Prisma.AssessmentQuestionWhereInput = {}): Prisma.AssessmentQuestionWhereInput {
  return { AND: [scope, {
    active: true, origin: "BANK", reviewStatus: "APPROVED",
    qualificationReviewedAt: { not: null }, qualificationReviewerId: { not: null },
    qualificationCompetency: { not: null }, qualificationEvidence: { not: null },
    OR: [
      { qualificationApprovalMethod: "ADMIN_APPROVAL" },
      { qualificationApprovalMethod: "QUALIFIED_REVIEW", qualificationReviewerCredentials: { not: null } },
      { qualificationApprovalMethod: null, qualificationReviewerCredentials: { not: null } },
    ],
  }] };
}

export async function isQualificationAttemptEligible(
  tx: Prisma.TransactionClient,
  attempt: { certificationEligible: boolean; subject: string; topic: string; questionCount: number; items: { questionId: string }[] },
) {
  if (!attempt.certificationEligible || attempt.questionCount < 1 || attempt.items.length !== attempt.questionCount) return false;
  const ids = [...new Set(attempt.items.map(item => item.questionId))];
  if (ids.length !== attempt.questionCount) return false;
  await lockQuestionRows(tx, ids);
  return await tx.assessmentQuestion.count({ where: qualificationQuestionWhere({ id: { in: ids }, subject: attempt.subject, topic: attempt.topic }) }) === ids.length;
}
