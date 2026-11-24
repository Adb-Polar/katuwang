import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MINUTE_MS } from "@/lib/datetime";
import { MAX_SESSION_MINUTES } from "@/lib/sessionTime";

/**
 * GET: the tutor's own upcoming booked sessions, so the scheduling forms can
 * flag a clash while the tutor is still picking a time. Same scope as the
 * server-side overlap check (`hasSessionOverlap`).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
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

    // Include sessions that have started but may still be running.
    const earliestStart = new Date(Date.now() - MAX_SESSION_MINUTES * MINUTE_MS);
    const sessions = await prisma.classSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: earliestStart },
        class: { tutorProfileId: tutorProfile.id, status: "SCHEDULED" },
      },
      select: { id: true, scheduledAt: true, duration: true, topic: true, class: { select: { code: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        scheduledAt: s.scheduledAt,
        duration: s.duration,
        topic: s.topic,
        classCode: s.class.code,
      }))
    );
  } catch (error) {
    console.error("Error fetching busy sessions:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
