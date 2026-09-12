import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccessError, loadEnrolledSession } from "@/lib/sessionTestAccess";
import { serializeSessionTestAttempt } from "@/lib/sessionTestSerialize";
import { getSetting } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import type { SessionStatus, SessionTestKind } from "@prisma/client";

type Ctx = { params: Promise<{ classId: string; sessionId: string; kind: string }> };

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
  sessionTest: { select: { id: true, title: true, instructions: true } },
} as const;

/**
 * Only NEW starts are gated by the session's status — an in-progress attempt
 * is always resumable, so a learner who opened the pre-test seconds before
 * the tutor marked the session complete never loses their work.
 */
function newStartBlockReason(kind: SessionTestKind, sessionStatus: SessionStatus): string | null {
  if (sessionStatus === "CANCELLED") return "SESSION_CANCELLED";
  if (sessionStatus === "SCHEDULED" && kind === "POST") return "POST_NOT_OPEN";
  if (sessionStatus === "COMPLETED" && kind === "PRE") return "PRE_WINDOW_CLOSED";
  return null;
}

// ─── POST: Start (or Resume) a PRE/POST Session Test ───────────────────────
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    const { classId, sessionId, kind } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!(await getSetting("sessionTestsEnabled"))) {
      return NextResponse.json({ error: "Session tests are disabled." }, { status: 403 });
    }
    if (kind !== "PRE" && kind !== "POST") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const access = await loadEnrolledSession(session.user.id, classId, sessionId);
    if (isAccessError(access)) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const test = await prisma.sessionTest.findUnique({
      where: { sessionId },
      include: { questions: { orderBy: { position: "asc" }, select: { questionId: true, position: true } } },
    });
    // A DRAFT test is indistinguishable from no test at all — never leak that
    // a tutor is mid-build.
    if (!test || test.status === "DRAFT") {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }
    if (test.status === "CLOSED") {
      return NextResponse.json({ error: "This test is closed." }, { status: 409 });
    }

    const existing = await prisma.sessionTestAttempt.findUnique({
      where: { sessionTestId_learnerId_kind: { sessionTestId: test.id, learnerId: session.user.id, kind } },
      include: ATTEMPT_INCLUDE,
    });

    if (existing?.status === "SUBMITTED") {
      return NextResponse.json({ error: "You have already completed this test." }, { status: 409 });
    }
    if (existing) {
      return NextResponse.json(serializeSessionTestAttempt(existing, { reveal: false }), { status: 200 });
    }

    const blocked = newStartBlockReason(kind, access.session.status);
    if (blocked) {
      const message =
        blocked === "SESSION_CANCELLED"
          ? "This session was cancelled."
          : blocked === "POST_NOT_OPEN"
            ? "The post-test opens once the session is marked complete."
            : "The pre-test window has closed.";
      return NextResponse.json({ error: message, code: blocked }, { status: 409 });
    }

    let attempt;
    try {
      attempt = await prisma.sessionTestAttempt.create({
        data: {
          sessionTestId: test.id,
          learnerId: session.user.id,
          kind,
          totalQuestions: test.questions.length,
          items: {
            create: test.questions.map((q) => ({ questionId: q.questionId, position: q.position })),
          },
        },
        include: ATTEMPT_INCLUDE,
      });
    } catch (err) {
      // Two concurrent "start" calls (e.g. a double-fired effect) can both pass the
      // `existing` check above before either inserts — the loser hits the compound
      // unique constraint. Treat that as a resume, not a failure.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const raceWinner = await prisma.sessionTestAttempt.findUnique({
          where: { sessionTestId_learnerId_kind: { sessionTestId: test.id, learnerId: session.user.id, kind } },
          include: ATTEMPT_INCLUDE,
        });
        if (raceWinner) {
          return NextResponse.json(serializeSessionTestAttempt(raceWinner, { reveal: false }), { status: 200 });
        }
      }
      throw err;
    }

    return NextResponse.json(serializeSessionTestAttempt(attempt, { reveal: false }), { status: 201 });
  } catch (error) {
    console.error("Error starting session test:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
