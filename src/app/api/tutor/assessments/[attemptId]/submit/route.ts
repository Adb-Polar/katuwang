import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { submitAssessmentSchema } from "@/lib/validations/assessment";
import { serializeAttempt } from "@/lib/assessmentSerialize";

// ─── POST: Grade & Submit an Attempt ───────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        tutorProfile: { select: { id: true, userId: true } },
      },
    });

    if (!attempt || attempt.tutorProfile.userId !== session.user.id) {
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

    // Grade each served item; an unanswered or mismatched option counts as wrong.
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
      attempt.questionCount > 0 ? Math.round((correctCount / attempt.questionCount) * 100) : 0;
    const passed = scorePercent >= attempt.passPercent;

    const { subject, topic } = attempt;
    const tutorProfileId = attempt.tutorProfile.id;
    const certKey = { tutorProfileId_subject_topic: { tutorProfileId, subject, topic } };

    const existingCert = await prisma.topicCertification.findUnique({
      where: certKey,
      select: { status: true },
    });
    const autoCertify = passed ? await getSetting("autoCertifyOnAssessmentPass") : false;

    const updated = await prisma.$transaction(async (tx) => {
      for (const g of graded) {
        await tx.assessmentAttemptItem.update({
          where: { id: g.id },
          data: { selectedOptionId: g.selectedOptionId, isCorrect: g.isCorrect },
        });
      }

      const now = new Date();
      const attemptRow = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          status: passed ? "PASSED" : "FAILED",
          correctCount,
          scorePercent,
          submittedAt: now,
        },
        include: { items: { include: { question: { include: { options: true } } } } },
      });

      // Never downgrade a badge the tutor already earned.
      if (existingCert?.status !== "CERTIFIED") {
        if (passed && autoCertify) {
          await tx.topicCertification.upsert({
            where: certKey,
            update: { status: "CERTIFIED", certifiedAt: now, reviewedAt: now, reviewNote: null },
            create: {
              tutorProfileId,
              subject,
              topic,
              status: "CERTIFIED",
              certifiedAt: now,
              reviewedAt: now,
            },
          });
        } else if (passed) {
          const note = `Passed assessment (${scorePercent}%) — awaiting admin confirmation.`;
          await tx.topicCertification.upsert({
            where: certKey,
            update: {
              status: "PENDING",
              requestedAt: now,
              reviewedAt: null,
              certifiedAt: null,
              reviewNote: note,
            },
            create: { tutorProfileId, subject, topic, status: "PENDING", reviewNote: note },
          });
        } else {
          const note = `Did not pass assessment (${scorePercent}%). You may retake.`;
          await tx.topicCertification.upsert({
            where: certKey,
            update: {
              status: "REJECTED",
              reviewedAt: now,
              certifiedAt: null,
              reviewNote: note,
            },
            create: { tutorProfileId, subject, topic, status: "REJECTED", reviewedAt: now, reviewNote: note },
          });
        }
      }

      return attemptRow;
    });

    return NextResponse.json(serializeAttempt(updated, { reveal: true }));
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
