import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveServerSession } from "@/lib/serverSession";
import { isAdminRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAssessmentQuestionSchema } from "@/lib/validations/assessment";
import { lockQuestionRows, QuestionWriteError } from "@/lib/questionLocks";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { topicExists } from "@/lib/subjects";
import { catalogFailureResponse } from "@/lib/catalogError";
export async function POST(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const session = await getActiveServerSession();
    if (!session || !isAdminRole(session.user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { questionId } = await params;
    const body = await req.json();
    const reason = z.object({ reason: z.string().trim().min(10).max(1000) }).safeParse(body);
    if (!reason.success) return NextResponse.json({ error: "Explain the correction in at least 10 characters." }, { status: 400 });
    const preview = await prisma.assessmentQuestion.findFirst({ where: { id: questionId, origin: "BANK" } });
    if (!preview) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    const parsed = createAssessmentQuestionSchema.safeParse({ ...body, subject: preview.subject, topic: preview.topic });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid question." }, { status: 400 });
    if (!(await topicExists(preview.subject, preview.topic))) return NextResponse.json({ error: "The question's topic is no longer active in the catalog." }, { status: 400 });
    const version = await prisma.$transaction(async tx => {
      await lockQuestionRows(tx, [questionId]);
      const original = await tx.assessmentQuestion.findFirst({ where: { id: questionId, origin: "BANK" }, include: { _count: { select: { nextVersions: true } } } });
      if (!original) throw new QuestionWriteError("Question not found.", 404);
      if (original._count.nextVersions) throw new QuestionWriteError("A newer version already exists. Open the latest version to make another correction.");
      if (original.subject !== preview.subject || original.topic !== preview.topic) throw new QuestionWriteError("The question's catalog topic changed. Refresh and try again.");
      const { prompt, explanation, options, demoOnly } = parsed.data;
      if (original.reviewStatus === "DEMO" && !demoOnly && prompt === original.prompt) throw new QuestionWriteError("Replace the demo prompt with topic-specific content before requesting qualification review.", 400);
      const created = await tx.assessmentQuestion.create({ data: { reviewStatus: demoOnly ? "DEMO" : "UNREVIEWED", subject: original.subject, topic: original.topic, prompt, explanation: explanation || null, origin: "BANK", createdById: session.user.id, previousVersionId: original.id, version: original.version + 1, options: { create: options.map((option, position) => ({ ...option, position })) } }, include: { options: { orderBy: { position: "asc" } } } });
      await tx.assessmentQuestion.update({ where: { id: original.id }, data: { active: false } });
      await tx.auditLog.create({ data: { adminId: session.user.id, action: AUDIT_ACTIONS.QUESTION_VERSION_CREATED, targetType: AUDIT_TARGET_TYPES.QUESTION, targetId: created.id, reason: `Corrects ${original.id} (v${original.version}): ${reason.data.reason}` } });
      return created;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
    return NextResponse.json({ ...version, inUse: false, canDelete: false }, { status: 201 });
  } catch (error) {
    const catalogFailure = catalogFailureResponse(error);if (catalogFailure) return catalogFailure;
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error creating corrected question version:", error);
    return NextResponse.json({ error: "Could not create a corrected version." }, { status: 500 });
  }
}
