import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTutorQuestionSchema } from "@/lib/validations/sessionTest";

type Ctx = { params: Promise<{ questionId: string }> };

async function loadOwnQuestion(userId: string, questionId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) return null;

  return prisma.assessmentQuestion.findFirst({
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
  return (
    q._count.sessionTestItems > 0 ||
    q.sessionTestLinks.some((l) => l.sessionTest.status !== "DRAFT")
  );
}

// ─── PATCH: Edit an Own Custom Question ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { topic, prompt, explanation, options } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tutor question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── DELETE: Remove an Own Custom Question ───────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
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

    // Detach from any draft tests, then delete (options cascade).
    await prisma.$transaction(async (tx) => {
      await tx.sessionTestQuestion.deleteMany({ where: { questionId } });
      await tx.assessmentQuestion.delete({ where: { id: questionId } });
    });

    return NextResponse.json({ message: "Question deleted." });
  } catch (error) {
    console.error("Error deleting tutor question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
