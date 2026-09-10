import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSessionSchema } from "@/lib/validations/class";
import { hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";
import { notifyMany } from "@/lib/notifications";

// ─── PATCH: Reschedule or Change Status of a Single Session ───────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
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

    const existingClass = await prisma.tutorClass.findUnique({
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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
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
      const conflict = await hasSessionOverlap(tutorProfile.id, effectiveStart, effectiveEnd, sessionId);
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

    // Flipping SCHEDULED -> COMPLETED with a published session test opens the
    // post-test window — notify every enrolled learner in the same transaction.
    const opensPostTest = targetSession.status === "SCHEDULED" && effectiveStatus === "COMPLETED";

    const updated = opensPostTest
      ? await prisma.$transaction(async (tx) => {
          const s = await tx.classSession.update({ where: { id: sessionId }, data: sessionData });

          const test = await tx.sessionTest.findUnique({
            where: { sessionId },
            select: { status: true },
          });
          if (test?.status === "PUBLISHED") {
            const learners = await tx.classEnrollment.findMany({
              where: { classId },
              select: { learnerId: true },
            });
            await notifyMany(
              tx,
              learners.map((l) => l.learnerId),
              "SESSION_POSTTEST_OPEN",
              `A post-test is now open for your "${s.topic}" session.`,
              `/learner/classes/${classId}`,
            );
          }

          return s;
        })
      : await prisma.classSession.update({ where: { id: sessionId }, data: sessionData });

    return NextResponse.json(updated);
  } catch (error) {
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
    const session = await getServerSession(authOptions);
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

    const existingClass = await prisma.tutorClass.findUnique({
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

    const isLastSession = existingClass.sessions.length === 1;
    if (isLastSession && existingClass._count.enrollments > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the only session of a class with enrolled learners — cancel or delete the whole class instead.",
        },
        { status: 400 }
      );
    }

    await prisma.classSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ message: "Session deleted successfully." });
  } catch (error) {
    console.error("Error deleting class session:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
