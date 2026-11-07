import { qualificationQuestionWhere } from "@/lib/qualificationBank";
import { lockActiveQuestions, QuestionWriteError } from "@/lib/questionLocks";
import { catalogFailureResponse } from "@/lib/catalogError";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";

import { startAssessmentSchema } from "@/lib/validations/assessment";
import { topicExists } from "@/lib/subjects";
import { getAssessmentConfig } from "@/lib/settings";
import { pickQuestionIds } from "@/lib/assessmentPicker";
import { serializeAttempt } from "@/lib/assessmentSerialize";

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
} as const;

// ─── GET: The Tutor's Own Attempts (summary, newest first) ──────────────────
export async function GET() {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const attempts = await prisma.assessmentAttempt.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: [{ startedAt: "desc" }],
      select: {
        id: true,
        subject: true,
        topic: true,
        attemptNo: true,
        status: true,
        certificationEligible: true,
        questionCount: true,
        correctCount: true,
        scorePercent: true,
        passPercent: true,
        startedAt: true,
        submittedAt: true,
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    const catalogFailure = catalogFailureResponse(error);
    if (catalogFailure) return catalogFailure;
    console.error("Error listing tutor assessment attempts:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Start (or Resume) an Assessment for a Topic ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = startAssessmentSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { subject, topic } = result.data;
    const subjectEnum = subject;

    if (!(await topicExists(subject, topic))) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    // Resume an unfinished attempt rather than starting a second one.
    const inProgress = await prisma.assessmentAttempt.findFirst({
      where: { tutorProfileId: tutorProfile.id, subject: subjectEnum, topic, status: "IN_PROGRESS" },
      include: ATTEMPT_INCLUDE,
    });
    if (inProgress) {
      return NextResponse.json(serializeAttempt(inProgress, { reveal: false }), { status: 200 });
    }

    const certification = await prisma.topicCertification.findUnique({
      where: { tutorProfileId_subject_topic: { tutorProfileId: tutorProfile.id, subject: subjectEnum, topic } },
      select: { status: true },
    });
    if (certification?.status === "CERTIFIED") {
      return NextResponse.json(
        { error: "You're already verified for this topic." },
        { status: 409 }
      );
    }

    const config = await getAssessmentConfig();

    const activeCount = await prisma.assessmentQuestion.count({
      // origin: "BANK" — must match pickQuestionIds' pool exactly, or a tutor
      // could author custom questions to clear minBankSize on a thin admin bank.
      where: qualificationQuestionWhere({ subject: subjectEnum, topic }),
    });
    if (activeCount < config.minBankSize) {
      return NextResponse.json(
        {
          error: "This topic does not have enough reviewed qualification questions. Ask an admin to arrange qualified topic review. Demo and unreviewed questions cannot grant certification.",
          code: "BANK_NOT_READY",
        },
        { status: 409 }
      );
    }

    const count = Math.min(config.questionCount, activeCount);

    const attempt = await prisma.$transaction(async (tx) => {
      const agg = await tx.assessmentAttempt.aggregate({
        where: { tutorProfileId: tutorProfile.id, subject: subjectEnum, topic },
        _max: { attemptNo: true },
      });
      const attemptNo = (agg._max?.attemptNo ?? 0) + 1;

      const questionIds = await pickQuestionIds(tx, {
        tutorProfileId: tutorProfile.id,
        subject: subjectEnum,
        topic,
        count,
      });

      if (questionIds.length !== count) throw new QuestionWriteError("The question bank changed. Refresh and try again.");
      await lockActiveQuestions(tx, questionIds);
      if (await tx.assessmentQuestion.count({ where: qualificationQuestionWhere({ id: { in: questionIds }, subject: subjectEnum, topic }) }) !== questionIds.length) throw new QuestionWriteError("The qualification review changed. Refresh and try again.");
      if (await tx.assessmentQuestion.count({ where: qualificationQuestionWhere({ subject: subjectEnum, topic }) }) < config.minBankSize) throw new QuestionWriteError("The active question bank is no longer ready. Refresh and try again.");
      return tx.assessmentAttempt.create({
        data: {
          tutorProfileId: tutorProfile.id,
          subject: subjectEnum,
          topic,
          attemptNo,
          certificationEligible: true,
          questionCount: questionIds.length,
          passPercent: config.passPercent,
          items: {
            create: questionIds.map((questionId, position) => ({ questionId, position })),
          },
        },
        include: ATTEMPT_INCLUDE,
      });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(serializeAttempt(attempt, { reveal: false }), { status: 201 });
  } catch (error) {
    if (error instanceof QuestionWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    const catalogFailure = catalogFailureResponse(error);
    if (catalogFailure) return catalogFailure;
    console.error("Error starting assessment:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
