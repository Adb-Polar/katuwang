import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setClassTestQuestionsSchema } from "@/lib/validations/classTest";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";
import { serializeClassTest } from "@/lib/classTestSerialize";

type Ctx = { params: Promise<{ classId: string; testId: string }> };

// ─── PUT: Replace the Test's Ordered Question Set (DRAFT only) ─────────────
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, testId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedTest(session.user.id, classId, testId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    if (owned.test.status !== "DRAFT") {
      return NextResponse.json(
        { error: "The question set is locked once a test is published." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const result = setClassTestQuestionsSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const questionIds = [...new Set(result.data.questionIds)];
    if (questionIds.length !== result.data.questionIds.length) {
      return NextResponse.json({ error: "Duplicate question in the list." }, { status: 400 });
    }

    // Every id must be an active bank question of this class's subject, OR a
    // custom question this tutor owns.
    const allowed = await prisma.assessmentQuestion.findMany({
      where: {
        id: { in: questionIds },
        OR: [
          { origin: "BANK", active: true, subject: owned.tutorClass.subject },
          { origin: "TUTOR", ownerTutorProfileId: owned.tutorProfile.id },
        ],
      },
      select: { id: true },
    });
    if (allowed.length !== questionIds.length) {
      return NextResponse.json(
        { error: "One or more questions are not available for this test." },
        { status: 400 }
      );
    }

    const test = await prisma.$transaction(async (tx) => {
      await tx.classTestQuestion.deleteMany({ where: { classTestId: testId } });
      await tx.classTestQuestion.createMany({
        data: questionIds.map((questionId, position) => ({ classTestId: testId, questionId, position })),
      });
      return tx.classTest.findUniqueOrThrow({
        where: { id: testId },
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { question: { include: { options: { orderBy: { position: "asc" } } } } },
          },
        },
      });
    });

    return NextResponse.json(serializeClassTest(test));
  } catch (error) {
    console.error("Error setting class test questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
