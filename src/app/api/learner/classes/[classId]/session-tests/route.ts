import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: This Class's Sessions With Their Test Status (learner view) ─────
// A DRAFT test is indistinguishable from no test at all.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_learnerId: { classId, learnerId: session.user.id } },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this class." }, { status: 403 });
    }

    const sessions = await prisma.classSession.findMany({
      where: { classId },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        status: true,
        test: {
          select: {
            id: true,
            title: true,
            status: true,
            attempts: {
              where: { learnerId: session.user.id },
              select: { id: true, kind: true, status: true, scorePercent: true, submittedAt: true },
            },
          },
        },
      },
    });

    const rows = sessions.map((s) => {
      const test = s.test && s.test.status !== "DRAFT" ? s.test : null;
      const attemptOf = (kind: "PRE" | "POST") => test?.attempts.find((a) => a.kind === kind) ?? null;
      return {
        sessionId: s.id,
        topic: s.topic,
        scheduledAt: s.scheduledAt.toISOString(),
        sessionStatus: s.status,
        test: test
          ? { id: test.id, title: test.title, status: test.status }
          : null,
        pre: attemptOf("PRE"),
        post: attemptOf("POST"),
      };
    });

    return NextResponse.json({ sessions: rows });
  } catch (error) {
    console.error("Error listing learner session tests:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
