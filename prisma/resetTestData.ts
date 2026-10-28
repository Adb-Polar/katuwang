import type { PrismaClient } from "@prisma/client";

/** Explicit --reset operation. Preserve administrator identities, credentials and platform configuration. */
export async function resetTestData(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.sessionTestAttemptItem.deleteMany();
    await tx.sessionTestAttempt.deleteMany();
    await tx.sessionTestQuestion.deleteMany();
    await tx.sessionTest.deleteMany();
    await tx.assessmentAttemptItem.deleteMany();
    await tx.assessmentAttempt.deleteMany();
    await tx.questionRequest.deleteMany();
    await tx.assessmentOption.deleteMany();
    await tx.assessmentQuestion.deleteMany();
    await tx.topicCertification.deleteMany();
    await tx.reportViolation.deleteMany();
    await tx.report.deleteMany();
    await tx.classAppeal.deleteMany();
    await tx.classRecommendation.deleteMany();
    await tx.topicRequestHistory.deleteMany();
    await tx.topicRequestSlot.deleteMany();
    await tx.topicRequestTopic.deleteMany();
    await tx.topicRequest.deleteMany();
    await tx.classEnrollment.deleteMany();
    await tx.classSession.deleteMany();
    await tx.classTopic.deleteMany();
    await tx.tutorClass.deleteMany();
    await tx.tutorProfile.deleteMany();
    await tx.notification.deleteMany();
    await tx.chatbotMiss.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.verificationToken.deleteMany();
    await tx.user.deleteMany({ where: { role: { notIn: ["ADMIN", "SUPER_ADMIN"] } } });
    await tx.topic.deleteMany();
    await tx.subject.deleteMany();
  }, { timeout: 60000 });
  console.log("Test-data reset complete; administrator accounts and platform settings retained.");
}
