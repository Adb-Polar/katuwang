import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";

type Ctx = { params: Promise<{ testId: string; attemptId: string }> };

// ─── GET: One Learner's Attempt (admin drill-down) ─────────────────────────
// Double-blind: only the learner's anonymousId is exposed, never their `id`.
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { testId, attemptId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.sessionTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        sessionTest: { select: { id: true, title: true, instructions: true } },
        learner: { select: { anonymousId: true } },
      },
    });

    if (!attempt || attempt.sessionTestId !== testId) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeSessionTestAttempt(attempt, { reveal: true }),
      learner: attempt.learner,
    });
  } catch (error) {
    console.error("Error fetching session-test attempt (admin):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
