/** Synthetic review evidence for isolated automated tests only. Never seed live approvals. */
export function qualificationFixture(adminId: string) {
  return {
    reviewStatus: "APPROVED" as const,
    qualificationReviewedAt: new Date(), qualificationReviewerId: adminId,
    qualificationCompetency: "Isolated QA topic competency fixture",
    qualificationEvidence: "Isolated QA review evidence; not a real qualification review",
    qualificationReviewerCredentials: "Synthetic qualified reviewer fixture for automated verification only",
  };
}
