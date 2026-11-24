import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bucketByDay, localDayKey, parseReportFilters } from "@/lib/reportFilters";

// ─── GET: Platform breakdown counts for the admin dashboard ─────────────────
// Optional filters: `from` + `to` (YYYY-MM-DD, by creation date), `gradeLevel`,
// `subject`. With no dates the breakdowns cover all time and the enrollment
// trend shows the last 30 days.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsed = parseReportFilters(new URL(req.url).searchParams, new Date());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { from, to, gradeLevel, subject, trendFrom, trendDays } = parsed.filters;

    const inRange = from && to ? { gte: from, lte: to } : undefined;
    const trendTo = new Date(trendFrom.getFullYear(), trendFrom.getMonth(), trendFrom.getDate() + trendDays);

    const userWhere: Prisma.UserWhereInput = {
      ...(inRange ? { createdAt: inRange } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    };
    const classWhere: Prisma.TutorClassWhereInput = {
      ...(inRange ? { createdAt: inRange } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(subject ? { subject } : {}),
    };
    const certificationWhere: Prisma.TopicCertificationWhereInput = {
      ...(inRange ? { requestedAt: inRange } : {}),
      ...(subject ? { subject } : {}),
    };
    // Enrollments are filtered by the class's subject and the learner's grade.
    const enrollmentScope: Prisma.ClassEnrollmentWhereInput = {
      ...(subject ? { class: { subject } } : {}),
      ...(gradeLevel ? { learner: { gradeLevel } } : {}),
    };

    const [
      usersByRole,
      usersByGradeLevel,
      usersByStatus,
      classesBySubject,
      classesByStatus,
      certificationsByStatus,
      totalEnrollments,
      trendRows,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], where: userWhere, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["gradeLevel"], where: userWhere, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["status"], where: userWhere, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["subject"], where: classWhere, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["status"], where: classWhere, _count: { _all: true } }),
      prisma.topicCertification.groupBy({ by: ["status"], where: certificationWhere, _count: { _all: true } }),
      prisma.classEnrollment.count({ where: enrollmentScope }),
      prisma.classEnrollment.findMany({
        where: { ...enrollmentScope, enrolledAt: { gte: trendFrom, lt: trendTo } },
        select: { enrolledAt: true },
      }),
    ]);

    return NextResponse.json({
      range: {
        allTime: !inRange,
        from: from ? localDayKey(from) : null,
        to: to ? localDayKey(to) : null,
        trendDays,
      },
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
      usersByGradeLevel: usersByGradeLevel.map((r) => ({ gradeLevel: r.gradeLevel, count: r._count._all })),
      usersByStatus: usersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      classesBySubject: classesBySubject.map((r) => ({ subject: r.subject, count: r._count._all })),
      classesByStatus: classesByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      certificationsByStatus: certificationsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      enrollments: {
        total: totalEnrollments,
        inPeriod: trendRows.length,
        byDay: bucketByDay(
          trendRows.map((row) => new Date(row.enrolledAt)),
          trendFrom,
          trendDays
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
