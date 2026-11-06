import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { lockTutorSchedule, lockClassRow, ClassWriteError } from "@/lib/classLocks";
import { updateSessionSchema } from "@/lib/validations/class";
import { hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";

// ─── PATCH: Reschedule or Change Status of a Single Session ───────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; sessionId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      await lockTutorSchedule(tx, tutorProfile.id);
      await lockClassRow(tx, classId);
      const existingClass = await tx.tutorClass.findUnique({
        where: { id: classId },
        include: { topics: true, sessions: true },
      });

      if (!existingClass) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      if (existingClass.tutorProfileId !== tutorProfile.id) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (existingClass.status === "SUSPENDED" || existingClass.status === "BANNED") {
        return NextResponse.json(
          { error: "This class was suspended or banned by an administrator and can't be modified." },
          { status: 403 }
        );
      }

      const targetSession = existingClass.sessions.find((s) => s.id === sessionId);
      if (!targetSession) {
        return NextResponse.json({ error: "Session not found." }, { status: 404 });
      }

      const body = await req.json();
      const result = updateSessionSchema.safeParse(body);

      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
        return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
      }

      const { topic, scheduledAt, duration, status } = result.data;

      if (topic !== undefined) {
        const classTopics = existingClass.topics.map((t) => t.topic);
        if (!classTopics.includes(topic)) {
          return NextResponse.json(
            { error: "Session topic must be one of the class's selected topics." },
            { status: 400 }
          );
        }
      }

      if (targetSession.status === "COMPLETED" && (
        (status !== undefined && status !== "COMPLETED") || topic !== undefined || scheduledAt !== undefined || duration !== undefined
      )) {
        return NextResponse.json({ error: "Completed sessions are kept for history and cannot be reopened or rescheduled." }, { status: 409 });
      }

      const effectiveStatus = status ?? targetSession.status;
      const effectiveStart = scheduledAt ? new Date(scheduledAt) : targetSession.scheduledAt;
      const effectiveDuration = duration ?? targetSession.duration;

      if (effectiveStatus === "SCHEDULED") {
        if (effectiveStart.getTime() < Date.now()) {
          return NextResponse.json(
            { error: "Cannot schedule a session in the past." },
            { status: 400 }
          );
        }

        const effectiveEnd = new Date(effectiveStart.getTime() + effectiveDuration * MINUTE_MS);
        const conflict = await hasSessionOverlap(tutorProfile.id, effectiveStart, effectiveEnd, sessionId, tx);
        if (conflict) {
          return NextResponse.json(
            { error: "Time conflict detected: You already have a session scheduled during this time." },
            { status: 409 }
          );
        }
      }

      const sessionData = {
        ...(topic !== undefined ? { topic } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt: effectiveStart } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(status !== undefined ? { status } : {}),
      };

      const updated = await tx.classSession.update({ where: { id: sessionId }, data: sessionData });
      if (status === "COMPLETED" && targetSession.status !== "COMPLETED") {
        await tx.sessionTest.updateMany({
          where: { sessionId, pretestClosedAt: null }, data: { pretestClosedAt: new Date() },
        });
      }

      return NextResponse.json(updated);
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
  } catch (error) {
    if (error instanceof ClassWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error updating class session:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Remove a Single Session ───────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; sessionId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { classId, sessionId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      await lockTutorSchedule(tx, tutorProfile.id);
      await lockClassRow(tx, classId);
      const existingClass = await tx.tutorClass.findUnique({
        where: { id: classId },
        include: {
          sessions: true,
          _count: { select: { enrollments: true } },
        },
      });

      if (!existingClass) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      if (existingClass.tutorProfileId !== tutorProfile.id) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (existingClass.status === "SUSPENDED" || existingClass.status === "BANNED") {
        return NextResponse.json(
          { error: "This class was suspended or banned by an administrator and can't be modified." },
          { status: 403 }
        );
      }

      const targetSession = existingClass.sessions.find((s) => s.id === sessionId);
      if (!targetSession) {
        return NextResponse.json({ error: "Session not found." }, { status: 404 });
      }

      if (targetSession.status !== "SCHEDULED") {
        return NextResponse.json(
          { error: "Cannot delete a completed or cancelled session; its record is kept for history." },
          { status: 400 }
        );
      }

      if (await tx.sessionTest.findUnique({ where: { sessionId }, select: { id: true } })) {
        return NextResponse.json({ error: "This session has assessment records. Cancel it instead to preserve history." }, { status: 409 });
      }

      const isLastSession = existingClass.sessions.length === 1;
      if (isLastSession && existingClass._count.enrollments > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the only session of a class with enrolled learners — cancel the session or class instead.",
          },
          { status: 400 }
        );
      }

      await tx.classSession.delete({ where: { id: sessionId } });

      return NextResponse.json({ message: "Session deleted successfully." });
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
  } catch (error) {
    if (error instanceof ClassWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json({ error: "This session has assessment records. Cancel it instead to preserve history." }, { status: 409 });
    }
    console.error("Error deleting class session:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
