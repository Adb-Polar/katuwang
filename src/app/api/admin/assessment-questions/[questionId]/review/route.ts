import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import { isAdminRole } from "@/lib/permissions";
import { lockQuestionRows, QuestionWriteError } from "@/lib/questionLocks";
import { topicExists } from "@/lib/subjects";
import { catalogFailureResponse } from "@/lib/catalogError";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE"), competency: z.string().trim().min(10).max(2000), reviewerCredentials: z.string().trim().min(10).max(2000), evidence: z.string().trim().min(20).max(4000), attestation: z.literal(true) }),
  z.object({ decision: z.literal("REVOKE"), reason: z.string().trim().min(10).max(1000) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const session = await getActiveServerSession();
    if (!session || !isAdminRole(session.user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Record the topic competency, qualified reviewer's credentials, review evidence and attestation; revocation requires a reason." }, { status: 400 });
    const { questionId } = await params;
    const preview = await prisma.assessmentQuestion.findFirst({ where: { id: questionId, origin: "BANK" } });
    if (!preview) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if (parsed.data.decision === "APPROVE" && !(await topicExists(preview.subject, preview.topic))) return NextResponse.json({ error: "An active catalog topic is required." }, { status: 400 });
    const question = await prisma.$transaction(async tx => {
      await lockQuestionRows(tx, [questionId]);
      const current = await tx.assessmentQuestion.findFirst({ where: { id: questionId, origin: "BANK" }, include: { options: true, _count: { select: { nextVersions: true } } } });
      if (!current) throw new QuestionWriteError("Question not found.", 404);
      const input = parsed.data;
      if (input.decision === "APPROVE") {
        if (current.subject !== preview.subject || current.topic !== preview.topic) throw new QuestionWriteError("The topic changed. Reload before reviewing.");
        if (current.reviewStatus === "DEMO") throw new QuestionWriteError("Demo content cannot qualify a real tutor. Create a topic-specific corrected version and obtain qualified review.");
        if (!current.active || current._count.nextVersions || current.reviewStatus === "APPROVED") throw new QuestionWriteError("Review requires an active, latest, unreviewed question version.");
        if (current.options.length < 2 || current.options.length > 6 || current.options.filter(o => o.isCorrect).length !== 1 || (current.explanation?.trim().length ?? 0) < 10) throw new QuestionWriteError("Provide valid options, one answer key and a substantive explanation before review.", 400);
      } else if (current.reviewStatus !== "APPROVED") throw new QuestionWriteError("Only an approved review can be revoked.");
      const now = new Date();
      const updated = await tx.assessmentQuestion.update({ where: { id: questionId }, data: input.decision === "APPROVE" ? {
        reviewStatus: "APPROVED", qualificationApprovalMethod: "QUALIFIED_REVIEW", qualificationReviewedAt: now, qualificationReviewerId: session.user.id,
        qualificationCompetency: input.competency, qualificationEvidence: input.evidence, qualificationReviewerCredentials: input.reviewerCredentials,
        lockedAt: current.lockedAt ?? now,
      } : { reviewStatus: "UNREVIEWED", qualificationApprovalMethod: null, qualificationReviewedAt: null } });
      await tx.auditLog.create({ data: { adminId: session.user.id, action: input.decision === "APPROVE" ? AUDIT_ACTIONS.QUESTION_QUALIFICATION_APPROVED : (current.qualificationApprovalMethod === "ADMIN_APPROVAL" ? AUDIT_ACTIONS.QUESTION_ASSESSMENT_ADMIN_REVOKED : AUDIT_ACTIONS.QUESTION_QUALIFICATION_REVOKED), targetType: AUDIT_TARGET_TYPES.QUESTION, targetId: questionId, reason: JSON.stringify({ subject: current.subject, topic: current.topic, version: current.version, ...input }) } });
      return updated;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
    return NextResponse.json(question);
  } catch (error) {
    const catalogFailure = catalogFailureResponse(error);if (catalogFailure) return catalogFailure;
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Qualification review failed:", error);
    return NextResponse.json({ error: "Could not record qualification review." }, { status: 500 });
  }
}
