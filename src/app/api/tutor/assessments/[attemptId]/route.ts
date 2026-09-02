import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAttempt } from "@/lib/assessmentSerialize";

// ─── GET: One of the Tutor's Own Attempts ───────────────────────────────────
// In-progress → questions only. Submitted → full graded review.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        tutorProfile: { select: { userId: true } },
      },
    });

    if (!attempt || attempt.tutorProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    return NextResponse.json(serializeAttempt(attempt, { reveal: attempt.status !== "IN_PROGRESS" }));
  } catch (error) {
    console.error("Error fetching tutor assessment attempt:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
