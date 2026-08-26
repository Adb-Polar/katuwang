import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";

// ─── GET: Fetch Browsable + Enrolled Classes for a Learner ───────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reinstateExpiredClasses();

    const classes = await prisma.tutorClass.findMany({
      where: {
        OR: [
          { status: "SCHEDULED", scheduledAt: { gt: new Date() } },
          { enrollments: { some: { learnerId: session.user.id } } },
        ],
      },
      include: {
        topics: true,
        tutorProfile: {
          select: {
            id: true,
            user: { select: { id: true, anonymousId: true } },
            topicCertifications: {
              where: { status: "CERTIFIED" },
              select: { subject: true, topic: true },
            },
          },
        },
        _count: { select: { enrollments: true } },
        enrollments: { where: { learnerId: session.user.id }, select: { id: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(
      classes.map(({ tutorProfile, topics, ...c }) => ({
        ...c,
        topics: topics.map((t) => t.topic),
        verifiedTopics: tutorProfile.topicCertifications
          .filter((cert) => cert.subject === c.subject)
          .map((cert) => cert.topic),
        tutor: { id: tutorProfile.user.id, anonymousId: tutorProfile.user.anonymousId },
      }))
    );
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
