import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAttempt } from "@/lib/assessmentSerialize";

// ─── GET: Full Attempt Detail (admin sees everything) ───────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { attemptId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        items: { include: { question: { include: { options: true } } } },
        tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const { tutorProfile, ...rest } = attempt;
    return NextResponse.json({
      ...serializeAttempt(rest, { reveal: true }),
      tutor: tutorProfile.user,
    });
  } catch (error) {
    console.error("Error fetching assessment attempt detail:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
