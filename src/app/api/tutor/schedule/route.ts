import { NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { HOUR_MS } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import type { BusySession } from "@/lib/sessionTimes";

/** Long enough to still include a session that is running right now. */
const LOOKBACK_MS = 4 * HOUR_MS;

/**
 * GET: the tutor's own upcoming sessions, so the schedule forms can flag an
 * overlap while the tutor is still typing. Holds the same sessions that
 * `hasSessionOverlap` checks on save.
 */
export async function GET() {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const sessions = await prisma.classSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: new Date(Date.now() - LOOKBACK_MS) },
        class: { tutorProfile: { userId: session.user.id }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, scheduledAt: true, duration: true, class: { select: { code: true, subject: true } } },
    });

    const busy: BusySession[] = sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt.toISOString(),
      duration: s.duration,
      label: `${subjectDisplayLabel(s.class.subject)} · ${s.class.code}`,
    }));

    return NextResponse.json({ sessions: busy });
  } catch (error) {
    console.error("Error fetching tutor schedule:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
