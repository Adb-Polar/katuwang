import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitAssessmentSchema } from "@/lib/validations/assessment";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";
import { gradeAttempt } from "@/lib/gradeAttempt";

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
  sessionTest: { select: { id: true, title: true, instructions: true } },
} as const;

// ─── POST: Grade & Submit a Session-Test Attempt ───────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.sessionTestAttempt.findUnique({
      where: { id: attemptId },
      include: ATTEMPT_INCLUDE,
    });

    // Not the caller's attempt: 404, not 403 — don't confirm the id exists.
    if (!attempt || attempt.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This attempt has already been submitted." }, { status: 409 });
    }

    const body = await req.json();
    const result = submitAssessmentSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { graded, correctCount, scorePercent } = gradeAttempt(
      attempt.items,
      result.data.answers,
      attempt.totalQuestions,
    );

    const updated = await prisma.$transaction(async (tx) => {
      for (const g of graded) {
        await tx.sessionTestAttemptItem.update({
          where: { id: g.id },
          data: { selectedOptionId: g.selectedOptionId, isCorrect: g.isCorrect },
        });
      }
      return tx.sessionTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          correctCount,
          scorePercent,
          submittedAt: new Date(),
        },
        include: ATTEMPT_INCLUDE,
      });
    });

    return NextResponse.json(serializeSessionTestAttempt(updated, { reveal: true }));
  } catch (error) {
    console.error("Error submitting session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
