import { isQualificationAttemptEligible } from "@/lib/qualificationBank";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { AssessmentSubmissionError, assertSubmissionClaim } from "@/lib/assessmentSubmission";
import { lockTutorProfile, ClassWriteError } from "@/lib/classLocks";
import { getSetting } from "@/lib/settings";
import { submitAssessmentSchema } from "@/lib/validations/assessment";
import { serializeAttempt } from "@/lib/assessmentSerialize";
import { gradeAttempt } from "@/lib/gradeAttempt";

// ─── POST: Grade & Submit an Attempt ───────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getActiveServerSession();
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
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { graded, correctCount, scorePercent } = gradeAttempt(
      attempt.items,
      result.data.answers,
      attempt.questionCount,
    );
    const passed = scorePercent >= attempt.passPercent;

    const { subject, topic } = attempt;
    const tutorProfileId = attempt.tutorProfile.id;
    const certKey = { tutorProfileId_subject_topic: { tutorProfileId, subject, topic } };

    const autoCertify = passed ? await getSetting("autoCertifyOnAssessmentPass") : false;

    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();
      await lockTutorProfile(tx, tutorProfileId);
      const certificationEligible = await isQualificationAttemptEligible(tx, attempt);
      const claimed = await tx.assessmentAttempt.updateMany({
        where: { id: attemptId, tutorProfileId, status: "IN_PROGRESS" },
        data: { status: passed ? "PASSED" : "FAILED", correctCount, scorePercent, submittedAt: now, certificationEligible },
      });
      assertSubmissionClaim(claimed);
      const existingCert = await tx.topicCertification.findUnique({ where: certKey, select: { status: true } });
      for (const g of graded) {
        await tx.assessmentAttemptItem.update({
          where: { id: g.id },
          data: { selectedOptionId: g.selectedOptionId, isCorrect: g.isCorrect },
        });
      }

      const attemptRow = await tx.assessmentAttempt.findUniqueOrThrow({
        where: { id: attemptId },
        include: { items: { include: { question: { include: { options: true } } } } },
      });

      // Never downgrade a badge the tutor already earned.
      if (certificationEligible && existingCert?.status !== "CERTIFIED") {
        if (passed && autoCertify) {
          await tx.topicCertification.upsert({
            where: certKey,
            update: { status: "CERTIFIED", certifiedAt: now, reviewedAt: now, reviewNote: null, approvalMethod: "ASSESSMENT", approvalEvidence: null, qualifyingAttemptId: attemptId },
            create: {
              tutorProfileId,
              subject,
              topic,
              status: "CERTIFIED",
              approvalMethod: "ASSESSMENT",
              qualifyingAttemptId: attemptId,
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
              approvalMethod: null, approvalEvidence: null, qualifyingAttemptId: attemptId,
              requestedAt: now,
              reviewedAt: null,
              certifiedAt: null,
              reviewNote: note,
            },
            create: { tutorProfileId, subject, topic, status: "PENDING", reviewNote: note, qualifyingAttemptId: attemptId },
          });
        } else {
          const note = `Did not pass assessment (${scorePercent}%). You may retake.`;
          await tx.topicCertification.upsert({
            where: certKey,
            update: {
              status: "REJECTED",
              approvalMethod: null, approvalEvidence: null, qualifyingAttemptId: null,
              reviewedAt: now,
              certifiedAt: null,
              reviewNote: note,
            },
            create: { tutorProfileId, subject, topic, status: "REJECTED", reviewedAt: now, reviewNote: note },
          });
        }
      }

      return attemptRow;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(serializeAttempt(updated, { reveal: true, revealAnswers: false }));
  } catch (error) {
    if (error instanceof AssessmentSubmissionError || error instanceof ClassWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error submitting assessment:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
