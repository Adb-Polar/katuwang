import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionTestStatusSchema } from "@/lib/validations/sessionTest";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { notifyMany } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";

type Ctx = { params: Promise<{ classId: string; sessionId: string }> };

// ─── PATCH: Publish or Close a Test ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
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

    const body = await req.json();
    const result = sessionTestStatusSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status } = result.data;
    const now = new Date();

    if (status === "PUBLISHED") {
      if (!(await getSetting("sessionTestsEnabled"))) {
        return NextResponse.json({ error: "Session tests are disabled." }, { status: 403 });
      }
      if (owned.test.status !== "DRAFT") {
        return NextResponse.json({ error: "Only a draft test can be published." }, { status: 409 });
      }
      if (owned.test.questions.length === 0) {
        return NextResponse.json({ error: "Add at least one question before publishing." }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.sessionTest.update({
          where: { id: owned.test!.id },
          data: { status: "PUBLISHED", publishedAt: now },
        });

        const learners = await tx.classEnrollment.findMany({
          where: { classId },
          select: { learnerId: true },
        });
        await notifyMany(
          tx,
          learners.map((l) => l.learnerId),
          "SESSION_PRETEST_OPEN",
          `A pre-test is now open for your upcoming "${owned.session.topic}" session.`,
          `/learner/classes/${classId}`,
        );

        return t;
      });

      return NextResponse.json(updated);
    }

    // status === "CLOSED"
    if (owned.test.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Only a published test can be closed." }, { status: 409 });
    }
    const updated = await prisma.sessionTest.update({
      where: { id: owned.test.id },
      data: { status: "CLOSED", closedAt: now },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating session test status:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
