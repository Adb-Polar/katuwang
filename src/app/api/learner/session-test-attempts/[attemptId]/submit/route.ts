import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { canRevealLearnerSessionAnswers } from "@/lib/sessionTestFeedback";
import { AssessmentSubmissionError, assertSubmissionClaim } from "@/lib/assessmentSubmission";
import { checkLearnerAttemptAccess } from "@/lib/sessionTestAccess";
import { submitAssessmentSchema } from "@/lib/validations/assessment";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";
import { gradeAttempt } from "@/lib/gradeAttempt";
import { notify } from "@/lib/notifications";

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
    const session = await getActiveServerSession();
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

    const accessError = await checkLearnerAttemptAccess(session.user.id, attempt);
    if (accessError) return NextResponse.json({ error: accessError.error }, { status: accessError.status });

    const body = await req.json();
    const result = submitAssessmentSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { graded, correctCount, scorePercent } = gradeAttempt(
      attempt.items,
      result.data.answers,
      attempt.totalQuestions,
    );

    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.sessionTestAttempt.updateMany({
        where: { id: attemptId, learnerId: session.user.id, status: "IN_PROGRESS" },
        data: { status: "SUBMITTED", correctCount, scorePercent, submittedAt: now },
      });
      assertSubmissionClaim(claimed);
      const currentAccess = await checkLearnerAttemptAccess(session.user.id, attempt, tx);
      if (currentAccess) throw new AssessmentSubmissionError(currentAccess.error, currentAccess.status);
      for (const g of graded) {
        await tx.sessionTestAttemptItem.update({
          where: { id: g.id },
          data: { selectedOptionId: g.selectedOptionId, isCorrect: g.isCorrect },
        });
      }
      const submitted = await tx.sessionTestAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: ATTEMPT_INCLUDE });

      if (submitted.kind === "PRE") {
        const owner = await tx.sessionTest.findUnique({
          where: { id: submitted.sessionTestId },
          select: {
            sessionId: true,
            session: {
              select: {
                classId: true,
                topic: true,
                class: { select: { tutorProfile: { select: { userId: true } } } },
              },
            },
          },
        });
        if (owner) {
          await notify(
            tx,
            owner.session.class.tutorProfile.userId,
            "SESSION_PRETEST_TAKEN",
            `A learner took the pre-test for your "${owner.session.topic}" session.`,
            `/tutor/classes/${owner.session.classId}/sessions/${owner.sessionId}/test/results`,
          );
        }
      }

      return submitted;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(serializeSessionTestAttempt(updated, { reveal: true, revealAnswers: await canRevealLearnerSessionAnswers(updated) }));
  } catch (error) {
    if (error instanceof AssessmentSubmissionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error submitting session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
