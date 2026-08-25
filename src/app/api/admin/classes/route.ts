import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: List All Classes for Moderation ──────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const classes = await prisma.tutorClass.findMany({
      include: {
        topics: true,
        tutorProfile: {
          select: {
            user: { select: { id: true, anonymousId: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(
      classes.map(({ tutorProfile, topics, ...c }) => ({
        ...c,
        topics: topics.map((t) => t.topic),
        tutor: tutorProfile.user,
      }))
    );
  } catch (error) {
    console.error("Error fetching admin class list:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
