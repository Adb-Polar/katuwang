import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccessError, loadEnrolledClass } from "@/lib/classTestAccess";
import { serializeClassTestAttempt } from "@/lib/classTestSerialize";

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
  classTest: { select: { id: true, kind: true, title: true, instructions: true } },
} as const;

// ─── POST: Start (or Resume) a Class Test ────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string; testId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, testId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const access = await loadEnrolledClass(session.user.id, classId);
    if (isAccessError(access)) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const test = await prisma.classTest.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { position: "asc" }, select: { questionId: true, position: true } } },
    });
    if (!test || test.classId !== classId) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    const existing = await prisma.classTestAttempt.findUnique({
      where: { classTestId_learnerId: { classTestId: testId, learnerId: session.user.id } },
      include: ATTEMPT_INCLUDE,
    });

    if (existing?.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "You have already completed this test." },
        { status: 409 }
      );
    }
    if (existing) {
      return NextResponse.json(serializeClassTestAttempt(existing, { reveal: false }), { status: 200 });
    }

    if (test.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This test is not open." },
        { status: 400 }
      );
    }

    const attempt = await prisma.classTestAttempt.create({
      data: {
        classTestId: testId,
        learnerId: session.user.id,
        totalQuestions: test.questions.length,
        items: {
          create: test.questions.map((q) => ({ questionId: q.questionId, position: q.position })),
        },
      },
      include: ATTEMPT_INCLUDE,
    });

    return NextResponse.json(serializeClassTestAttempt(attempt, { reveal: false }), { status: 201 });
  } catch (error) {
    console.error("Error starting class test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
