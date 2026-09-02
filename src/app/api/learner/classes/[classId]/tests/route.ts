import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccessError, loadEnrolledClass } from "@/lib/classTestAccess";

// ─── GET: Published Tests for an Enrolled Learner ─────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const access = await loadEnrolledClass(session.user.id, classId);
    if (isAccessError(access)) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const tests = await prisma.classTest.findMany({
      where: { classId, status: { in: ["PUBLISHED", "CLOSED"] } },
      orderBy: { kind: "asc" },
      select: {
        id: true,
        kind: true,
        title: true,
        instructions: true,
        status: true,
        _count: { select: { questions: true } },
        attempts: {
          where: { learnerId: session.user.id },
          select: { id: true, status: true, scorePercent: true, totalQuestions: true, submittedAt: true },
        },
      },
    });

    return NextResponse.json({
      tests: tests.map(({ attempts, ...t }) => ({ ...t, attempt: attempts[0] ?? null })),
    });
  } catch (error) {
    console.error("Error listing learner class tests:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
