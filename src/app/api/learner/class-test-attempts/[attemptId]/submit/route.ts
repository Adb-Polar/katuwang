import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitAssessmentSchema } from "@/lib/validations/assessment";
import { serializeClassTestAttempt } from "@/lib/classTestSerialize";

// ─── POST: Grade & Submit a Class-test Attempt ──────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.classTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        classTest: { select: { id: true, kind: true, title: true, instructions: true } },
      },
    });

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

    const answerByQuestion = new Map(result.data.answers.map((a) => [a.questionId, a.optionId]));

    const graded = attempt.items.map((item) => {
      const chosenId = answerByQuestion.get(item.questionId) ?? null;
      const chosen = item.question.options.find((o) => o.id === chosenId) ?? null;
      return {
        id: item.id,
        selectedOptionId: chosen ? chosen.id : null,
        isCorrect: chosen?.isCorrect === true,
      };
    });

    const correctCount = graded.filter((g) => g.isCorrect).length;
    const scorePercent =
      attempt.totalQuestions > 0 ? Math.round((correctCount / attempt.totalQuestions) * 100) : 0;

    const updated = await prisma.$transaction(async (tx) => {
      for (const g of graded) {
        await tx.classTestAttemptItem.update({
          where: { id: g.id },
          data: { selectedOptionId: g.selectedOptionId, isCorrect: g.isCorrect },
        });
      }
      return tx.classTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          correctCount,
          scorePercent,
          submittedAt: new Date(),
        },
        include: {
          items: { include: { question: { include: { options: true } } } },
          classTest: { select: { id: true, kind: true, title: true, instructions: true } },
        },
      });
    });

    return NextResponse.json(serializeClassTestAttempt(updated, { reveal: true }));
  } catch (error) {
    console.error("Error submitting class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
