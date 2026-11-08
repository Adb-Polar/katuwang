import type { Prisma } from "@prisma/client";
import { lockQuestionRows, isQuestionContentLocked, QuestionWriteError } from "@/lib/questionLocks";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { updateTutorQuestionSchema } from "@/lib/validations/sessionTest";

type Ctx = { params: Promise<{ questionId: string }> };

async function loadOwnQuestion(userId: string, questionId: string, db: Prisma.TransactionClient = prisma) {
  const tutorProfile = await db.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) return null;

  return db.assessmentQuestion.findFirst({
    where: { id: questionId, origin: "TUTOR", ownerTutorProfileId: tutorProfile.id },
    include: {
      options: { orderBy: { position: "asc" } },
      sessionTestLinks: { include: { sessionTest: { select: { status: true } } } },
      _count: { select: { sessionTestItems: true } },
    },
  });
}

/** True once the question is on a published/closed test or has been answered. */
function isLocked(q: NonNullable<Awaited<ReturnType<typeof loadOwnQuestion>>>) {
  return isQuestionContentLocked(q);
}

// ─── PATCH: Edit an Own Custom Question ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getActiveServerSession();
    const { questionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await loadOwnQuestion(session.user.id, questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    if (isLocked(existing)) {
      return NextResponse.json(
        { error: "This question is on a published test and can no longer be edited." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const result = updateTutorQuestionSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { topic, prompt, explanation, options } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
      await lockQuestionRows(tx, [questionId]);
      const current = await loadOwnQuestion(session.user.id, questionId, tx);
      if (!current) throw new QuestionWriteError("Question not found.", 404);
      if (isLocked(current)) throw new QuestionWriteError("This question is on a published test and can no longer be edited.");
      if (options !== undefined) {
        await tx.assessmentOption.deleteMany({ where: { questionId } });
        await tx.assessmentOption.createMany({
          data: options.map((o, i) => ({ questionId, text: o.text, isCorrect: o.isCorrect, position: i })),
        });
      }
      return tx.assessmentQuestion.update({
        where: { id: questionId },
        data: {
          ...(topic !== undefined ? { topic } : {}),
          ...(prompt !== undefined ? { prompt } : {}),
          ...(explanation !== undefined ? { explanation: explanation || null } : {}),
        },
        include: { options: { orderBy: { position: "asc" } } },
      });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error updating tutor question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── DELETE: Remove an Own Custom Question ───────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getActiveServerSession();
    const { questionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await loadOwnQuestion(session.user.id, questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    if (isLocked(existing)) {
      return NextResponse.json(
        { error: "This question is on a published test and can no longer be deleted." },
        { status: 409 }
      );
    }

    // Serialize with publication before detaching draft links.
    await prisma.$transaction(async (tx) => {
      await lockQuestionRows(tx, [questionId]);
      const current = await loadOwnQuestion(session.user.id, questionId, tx);
      if (!current) throw new QuestionWriteError("Question not found.", 404);
      if (isLocked(current)) throw new QuestionWriteError("This question is on a published test and can no longer be deleted.");
      await tx.sessionTestQuestion.deleteMany({ where: { questionId } });
      await tx.assessmentQuestion.delete({ where: { id: questionId } });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json({ message: "Question deleted." });
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error deleting tutor question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
