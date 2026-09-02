import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAssessmentQuestionSchema } from "@/lib/validations/assessment";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

async function loadQuestion(questionId: string) {
  return prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: {
      options: { orderBy: { position: "asc" } },
      _count: { select: { attemptItems: true } },
    },
  });
}

// ─── GET: One Bank Question ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const question = await loadQuestion(questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const { _count, ...q } = question;
    return NextResponse.json({ ...q, inUse: _count.attemptItems > 0 });
  } catch (error) {
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
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session || session.user.role !== "ADMIN") {
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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { prompt, explanation, options, active } = result.data;
    const inUse = existing._count.attemptItems > 0;
    const wantsContentEdit = prompt !== undefined || explanation !== undefined || options !== undefined;

    if (inUse && wantsContentEdit) {
      return NextResponse.json(
        { error: "This question has been used in an attempt. Retire it and create a new one to change its content." },
        { status: 409 }
      );
    }

    const retiring = active === false && existing.active === true;

    const updated = await prisma.$transaction(async (tx) => {
      if (options !== undefined) {
        await tx.assessmentOption.deleteMany({ where: { questionId } });
        await tx.assessmentOption.createMany({
          data: options.map((o, i) => ({ questionId, text: o.text, isCorrect: o.isCorrect, position: i })),
        });
      }

      const q = await tx.assessmentQuestion.update({
        where: { id: questionId },
        data: {
          ...(prompt !== undefined ? { prompt } : {}),
          ...(explanation !== undefined ? { explanation: explanation || null } : {}),
          ...(active !== undefined ? { active } : {}),
        },
        include: { options: { orderBy: { position: "asc" } } },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: retiring ? AUDIT_ACTIONS.QUESTION_RETIRED : AUDIT_ACTIONS.QUESTION_UPDATED,
          targetType: AUDIT_TARGET_TYPES.QUESTION,
          targetId: questionId,
          reason: `${existing.subject} · ${existing.topic}`,
        },
      });

      return q;
    });

    return NextResponse.json({ ...updated, inUse });
  } catch (error) {
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
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await loadQuestion(questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    if (existing._count.attemptItems > 0) {
      return NextResponse.json(
        { error: "This question has been used in an attempt. Retire it instead of deleting." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentQuestion.delete({ where: { id: questionId } });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.QUESTION_DELETED,
          targetType: AUDIT_TARGET_TYPES.QUESTION,
          targetId: questionId,
          reason: `${existing.subject} · ${existing.topic}`,
        },
      });
    });

    return NextResponse.json({ message: "Question deleted." });
  } catch (error) {
    console.error("Error deleting assessment question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
