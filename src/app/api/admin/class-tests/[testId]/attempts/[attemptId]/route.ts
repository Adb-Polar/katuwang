import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeClassTestAttempt } from "@/lib/classTestSerialize";

type Ctx = { params: Promise<{ testId: string; attemptId: string }> };

// ─── GET: One Learner's Attempt (admin drill-down) ─────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { testId, attemptId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.classTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        classTest: { select: { id: true, kind: true, title: true, instructions: true } },
        learner: { select: { id: true, anonymousId: true } },
      },
    });

    if (!attempt || attempt.classTestId !== testId) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeClassTestAttempt(attempt, { reveal: true }),
      learner: attempt.learner,
    });
  } catch (error) {
    console.error("Error fetching class-test attempt (admin):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
