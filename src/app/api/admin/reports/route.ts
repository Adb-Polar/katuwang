import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: Platform Breakdown Counts for Admin Reports ─────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const DAYS = 30;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (DAYS - 1));

    const [
      usersByRole,
      usersByGradeLevel,
      usersByStatus,
      classesBySubject,
      classesByStatus,
      certificationsByStatus,
      totalEnrollments,
      recentEnrollmentRows,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["gradeLevel"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["subject"], _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.topicCertification.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.classEnrollment.count(),
      prisma.classEnrollment.findMany({
        where: { enrolledAt: { gte: since } },
        select: { enrolledAt: true },
      }),
    ]);

    // Bucket the last 30 days of enrollments into a zero-filled daily series.
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const byDay = new Map<string, number>();
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay.set(dayKey(d), 0);
    }
    for (const row of recentEnrollmentRows) {
      const key = dayKey(new Date(row.enrolledAt));
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const enrollmentsByDay = Array.from(byDay, ([date, count]) => ({ date, count }));

    return NextResponse.json({
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
      usersByGradeLevel: usersByGradeLevel.map((r) => ({ gradeLevel: r.gradeLevel, count: r._count._all })),
      usersByStatus: usersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      classesBySubject: classesBySubject.map((r) => ({ subject: r.subject, count: r._count._all })),
      classesByStatus: classesByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      certificationsByStatus: certificationsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      enrollments: {
        total: totalEnrollments,
        last30Days: recentEnrollmentRows.length,
        byDay: enrollmentsByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
