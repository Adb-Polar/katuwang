import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { getSubjects } from "./subjects";
import { qualificationQuestionWhere } from "./qualificationBank";
import { lockQuestionRows, QuestionWriteError } from "./questionLocks";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "./auditLog";

/** An administrator authorizes assessment use; no academic credentials are invented. */
export async function approveBankForAssessments(db: PrismaClient, adminId: string, reason: string, dryRun = false) {
  const catalog = await getSubjects();
  const topics = new Set(catalog.flatMap(s => s.topics.map(t => JSON.stringify([s.slug, t.name]))));
  return db.$transaction(async tx => {
    const actor = await tx.user.findFirst({ where: { id: adminId, role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" }, select: { id: true } });
    if (!actor) throw new QuestionWriteError("An active administrator is required.", 403);
    const rows = await tx.assessmentQuestion.findMany({ where: { origin: "BANK", active: true, reviewStatus: { not: "DEMO" }, nextVersions: { none: {} } }, select: { id: true }, orderBy: { id: "asc" } });
    await lockQuestionRows(tx, rows.map(q => q.id));
    const questions = await tx.assessmentQuestion.findMany({ where: { id: { in: rows.map(q => q.id) }, active: true, reviewStatus: { not: "DEMO" }, nextVersions: { none: {} } }, include: { options: { orderBy: { position: "asc" } } }, orderBy: { id: "asc" } });
    const existing = await tx.assessmentQuestion.findMany({ where: qualificationQuestionWhere({ id: { in: questions.map(q => q.id) } }), select: { id: true } });
    const approved = new Set(existing.map(q => q.id));
    const pending = questions.filter(q => !approved.has(q.id));
    for (const q of pending) {
      if (!topics.has(JSON.stringify([q.subject, q.topic]))) throw new QuestionWriteError(`Question ${q.id} needs an active catalog topic.`, 400);
      if (q.prompt.trim().length < 5 || q.prompt.length > 1000 || (q.explanation?.trim().length ?? 0) < 10 || q.options.length < 2 || q.options.length > 6 || q.options.filter(o => o.isCorrect).length !== 1 || q.options.some(o => !o.text.trim() || o.text.length > 500) || new Set(q.options.map(o => o.text.trim().toLowerCase())).size !== q.options.length) throw new QuestionWriteError(`Question ${q.id} needs valid choices, one answer key, and an explanation.`, 400);
    }
    const now = new Date();
    if (!dryRun && pending.length) {
      const ids = pending.map(q => q.id);
      await tx.assessmentQuestion.updateMany({ where: { id: { in: ids }, lockedAt: null }, data: { lockedAt: now } });
      await tx.assessmentQuestion.updateMany({ where: { id: { in: ids } }, data: {
        reviewStatus: "APPROVED", qualificationApprovalMethod: "ADMIN_APPROVAL",
        qualificationReviewedAt: now, qualificationReviewerId: adminId,
        qualificationCompetency: "Administrator-approved use for the assigned catalog subject and topic. Catalog membership, choices, answer-key structure, and explanation presence were checked.",
        qualificationEvidence: JSON.stringify({ approvalMethod: "ADMIN_APPROVAL", reason, automatedChecks: ["active catalog membership", "valid choices", "single answer key", "explanation present"], academicReviewAttested: false }),
        qualificationReviewerCredentials: null,
      } });
      for (let i = 0; i < pending.length; i += 250) {
        await tx.auditLog.createMany({ data: pending.slice(i, i + 250).map(q => ({ adminId, action: AUDIT_ACTIONS.QUESTION_ASSESSMENT_ADMIN_APPROVED, targetType: AUDIT_TARGET_TYPES.QUESTION, targetId: q.id, reason: JSON.stringify({ approvalMethod: "ADMIN_APPROVAL", reason, subject: q.subject, topic: q.topic, version: q.version, academicReviewAttested: false, contentSha256: createHash("sha256").update(JSON.stringify([q.prompt, q.explanation, q.options.map(o => [o.position, o.text, o.isCorrect])])).digest("hex") }) })) });
      }
    }
    return { dryRun, activeQuestions: questions.length, alreadyApproved: approved.size, questionsToApprove: pending.length, approvedQuestions: dryRun ? 0 : pending.length, topics: new Set(questions.map(q => JSON.stringify([q.subject, q.topic]))).size, approvalMethod: "ADMIN_APPROVAL", academicReviewAttested: false };
  }, { isolationLevel: "ReadCommitted", timeout: 180000 });
}
