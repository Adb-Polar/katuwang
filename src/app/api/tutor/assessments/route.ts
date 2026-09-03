import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startAssessmentSchema } from "@/lib/validations/assessment";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { getAssessmentConfig } from "@/lib/settings";
import { pickQuestionIds } from "@/lib/assessmentPicker";
import { serializeAttempt } from "@/lib/assessmentSerialize";

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
} as const;

// ─── GET: The Tutor's Own Attempts (summary, newest first) ──────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

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
    console.error("Error listing tutor assessment attempts:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Start (or Resume) an Assessment for a Topic ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topic } = result.data;

    if (!SUBJECT_TOPICS[subject].includes(topic)) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    // Resume an unfinished attempt rather than starting a second one.
    const inProgress = await prisma.assessmentAttempt.findFirst({
      where: { tutorProfileId: tutorProfile.id, subject, topic, status: "IN_PROGRESS" },
      include: ATTEMPT_INCLUDE,
    });
    if (inProgress) {
      return NextResponse.json(serializeAttempt(inProgress, { reveal: false }), { status: 200 });
    }

    const certification = await prisma.topicCertification.findUnique({
      where: { tutorProfileId_subject_topic: { tutorProfileId: tutorProfile.id, subject, topic } },
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
      where: { subject, topic, active: true },
    });
    if (activeCount < config.minBankSize) {
      return NextResponse.json(
        {
          error: "This topic doesn't have enough questions yet. Request that an admin add some.",
          code: "BANK_NOT_READY",
        },
        { status: 409 }
      );
    }

    const count = Math.min(config.questionCount, activeCount);

    const attempt = await prisma.$transaction(async (tx) => {
      const agg = await tx.assessmentAttempt.aggregate({
        where: { tutorProfileId: tutorProfile.id, subject, topic },
        _max: { attemptNo: true },
      });
      const attemptNo = (agg._max.attemptNo ?? 0) + 1;

      const questionIds = await pickQuestionIds(tx, {
        tutorProfileId: tutorProfile.id,
        subject,
        topic,
        count,
      });

      return tx.assessmentAttempt.create({
        data: {
          tutorProfileId: tutorProfile.id,
          subject,
          topic,
          attemptNo,
          questionCount: questionIds.length,
          passPercent: config.passPercent,
          items: {
            create: questionIds.map((questionId, position) => ({ questionId, position })),
          },
        },
        include: ATTEMPT_INCLUDE,
      });
    });

    return NextResponse.json(serializeAttempt(attempt, { reveal: false }), { status: 201 });
  } catch (error) {
    console.error("Error starting assessment:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
