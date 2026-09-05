import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionTestQuestionsSchema } from "@/lib/validations/sessionTest";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { serializeSessionTest } from "@/lib/sessionTestSerialize";

type Ctx = { params: Promise<{ classId: string; sessionId: string }> };

// ─── PUT: Replace the Test's Ordered Question Set ──────────────────────────
// Editable only while DRAFT and with zero attempts — the question set is
// immutable once served, which is what makes the pre/post delta valid.
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owned = await loadOwnedSession(session.user.id, classId, sessionId);
    if (isAccessError(owned)) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }
    if (!owned.test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }
    if (owned.test.status !== "DRAFT" || owned.test._count.attempts > 0) {
      return NextResponse.json(
        { error: "The question set is locked once the test is published or attempted." },
        { status: 409 },
      );
    }

    const body = await req.json();
    const result = setSessionTestQuestionsSchema.safeParse(body);
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
        { status: 400 },
      );
    }

    const test = await prisma.$transaction(async (tx) => {
      await tx.sessionTestQuestion.deleteMany({ where: { sessionTestId: owned.test!.id } });
      await tx.sessionTestQuestion.createMany({
        data: questionIds.map((questionId, position) => ({
          sessionTestId: owned.test!.id,
          questionId,
          position,
        })),
      });
      return tx.sessionTest.findUniqueOrThrow({
        where: { id: owned.test!.id },
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { question: { include: { options: { orderBy: { position: "asc" } } } } },
          },
        },
      });
    });

    return NextResponse.json(serializeSessionTest(test));
  } catch (error) {
    console.error("Error setting session test questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
