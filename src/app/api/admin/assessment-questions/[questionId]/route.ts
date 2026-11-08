import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import type { Prisma } from "@prisma/client";
import { isQuestionContentLocked, lockQuestionRows, QuestionWriteError } from "@/lib/questionLocks";
import { prisma } from "@/lib/prisma";
import { updateAssessmentQuestionSchema } from "@/lib/validations/assessment";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

async function loadQuestion(questionId: string, db: Prisma.TransactionClient = prisma) {
  // Scoped to BANK so tutor-authored custom (session-test) questions are
  // invisible to the admin bank editor.
  return db.assessmentQuestion.findFirst({
    where: { id: questionId, origin: "BANK" },
    include: {
      options: { orderBy: { position: "asc" } },
      _count: { select: { attemptItems: true, sessionTestItems: true, sessionTestLinks: true, nextVersions: true } },
      sessionTestLinks: { include: { sessionTest: { select: { status: true, publishedAt: true } } } },
    },
  });
}

// ─── GET: One Bank Question ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { questionId } = await params;

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const question = await loadQuestion(questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const { _count, ...q } = question;
    return NextResponse.json({
      ...q,
      inUse: isQuestionContentLocked(question),
      canDelete: !isQuestionContentLocked(question) && !_count.sessionTestLinks && !_count.nextVersions && !question.previousVersionId,
    });
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error fetching assessment question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── PATCH: Edit (pre-use) or Toggle `active` (any time) ─────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { questionId } = await params;

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await loadQuestion(questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = updateAssessmentQuestionSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { prompt, explanation, options, active } = result.data;
    const updated = await prisma.$transaction(async (tx) => {
      await lockQuestionRows(tx, [questionId]);
      const current = await loadQuestion(questionId, tx);
      if (!current) throw new QuestionWriteError("Question not found.", 404);
      const inUse = isQuestionContentLocked(current);
      if (inUse && (prompt !== undefined || explanation !== undefined || options !== undefined)) {
        throw new QuestionWriteError("This question has immutable test or version history. Create a corrected version to change its content.");
      }
      if (active === true && current._count.nextVersions > 0) throw new QuestionWriteError("A newer version exists. Use that version instead of reactivating this one.");
      if (options !== undefined) {
        await tx.assessmentOption.deleteMany({ where: { questionId } });
        await tx.assessmentOption.createMany({ data: options.map((option, position) => ({ questionId, text: option.text, isCorrect: option.isCorrect, position })) });
      }
      const question = await tx.assessmentQuestion.update({
        where: { id: questionId },
        data: { ...(prompt !== undefined ? { prompt } : {}), ...(explanation !== undefined ? { explanation: explanation || null } : {}), ...(active !== undefined ? { active } : {}) },
        include: { options: { orderBy: { position: "asc" } } },
      });
      await tx.auditLog.create({ data: { adminId: session.user.id, action: active === false && current.active ? AUDIT_ACTIONS.QUESTION_RETIRED : AUDIT_ACTIONS.QUESTION_UPDATED, targetType: AUDIT_TARGET_TYPES.QUESTION, targetId: questionId, reason: `${current.subject} · ${current.topic}` } });
      return { ...question, inUse, canDelete: !inUse && !current._count.sessionTestLinks && !current._count.nextVersions && !current.previousVersionId };
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error updating assessment question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── DELETE: Hard-delete an Unused Question ──────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { questionId } = await params;

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await loadQuestion(questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await lockQuestionRows(tx, [questionId]);
      const current = await loadQuestion(questionId, tx);
      if (!current) throw new QuestionWriteError("Question not found.", 404);
      if (isQuestionContentLocked(current) || current._count.sessionTestLinks || current._count.nextVersions || current.previousVersionId) {
        throw new QuestionWriteError("This question has test or version history. Retire it instead of deleting.");
      }
      await tx.assessmentQuestion.delete({ where: { id: questionId } });
      await tx.auditLog.create({ data: { adminId: session.user.id, action: AUDIT_ACTIONS.QUESTION_DELETED, targetType: AUDIT_TARGET_TYPES.QUESTION, targetId: questionId, reason: `${current.subject} · ${current.topic}` } });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json({ message: "Question deleted." });
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error deleting assessment question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
