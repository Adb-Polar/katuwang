import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";

type Ctx = { params: Promise<{ classId: string; sessionId: string; attemptId: string }> };

// ─── GET: One Learner's Attempt on This Test (tutor drill-down) ───────────
// Double-blind: only the learner's anonymousId is exposed, never their `id`.
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId, attemptId } = await params;

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

    const attempt = await prisma.sessionTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        sessionTest: { select: { id: true, title: true, instructions: true } },
        learner: { select: { anonymousId: true } },
      },
    });

    if (!attempt || attempt.sessionTestId !== owned.test.id) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeSessionTestAttempt(attempt, { reveal: true }),
      learner: attempt.learner,
    });
  } catch (error) {
    console.error("Error fetching session-test attempt (tutor):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
