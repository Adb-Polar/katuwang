import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";

// ─── GET: One of the Learner's Own Session-Test Attempts ──────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.sessionTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        sessionTest: { select: { id: true, title: true, instructions: true } },
      },
    });

    // Not the caller's attempt: 404, not 403 — don't confirm the id exists.
    if (!attempt || attempt.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    return NextResponse.json(
      serializeSessionTestAttempt(attempt, { reveal: attempt.status === "SUBMITTED" }),
    );
  } catch (error) {
    console.error("Error fetching session-test attempt:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
