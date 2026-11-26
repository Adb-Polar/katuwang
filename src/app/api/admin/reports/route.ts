import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";
import {
  DAILY_BUCKET_MAX_DAYS,
  DEFAULT_TREND_DAYS,
  adminAnalyticsQuerySchema,
  schoolDayStart,
} from "@/lib/validations/analytics";

const FILTER_KEYS = ["from", "to", "role", "gradeLevel", "subject"] as const;

const dayKey = (date: Date) => parseLocalDateAndTime(date).date;

/** Zero-filled enrolment counts, one bucket per school day or per month. */
function bucketEnrollments(rows: { enrolledAt: Date }[], start: Date, days: number, bucket: "day" | "month") {
  const keyOf = (date: Date) => (bucket === "day" ? dayKey(date) : dayKey(date).slice(0, 7));
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) counts.set(keyOf(new Date(start.getTime() + i * DAY_MS)), 0);
  for (const row of rows) {
    const key = keyOf(new Date(row.enrolledAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}

// ─── GET: Platform breakdown counts for the admin dashboard ───────────────────
// Optional filters: from/to (school dates, inclusive), role, gradeLevel, subject.
// With no date range the breakdowns are all-time and the trend covers the last 30 days.
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const raw = Object.fromEntries(FILTER_KEYS.flatMap((key) => (params.get(key) ? [[key, params.get(key)!]] : [])));
    const parsed = adminAnalyticsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid filters." }, { status: 400 });
    }
    const { from, to, role, gradeLevel, subject } = parsed.data;

    const hasRange = Boolean(from && to);
    const today = parseLocalDateAndTime(new Date()).date;
    const trendStart = hasRange
      ? schoolDayStart(from!)
      : new Date(schoolDayStart(today).getTime() - (DEFAULT_TREND_DAYS - 1) * DAY_MS);
    const trendEnd = new Date(schoolDayStart(hasRange ? to! : today).getTime() + DAY_MS);
    const trendDays = Math.round((trendEnd.getTime() - trendStart.getTime()) / DAY_MS);
    const range = hasRange ? { gte: trendStart, lt: trendEnd } : undefined;

    const userWhere: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(range ? { createdAt: range } : {}),
    };
    const classWhere: Prisma.TutorClassWhereInput = {
      ...(subject ? { subject } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(range ? { createdAt: range } : {}),
    };
    const certificationWhere: Prisma.TopicCertificationWhereInput = {
      ...(subject ? { subject } : {}),
      ...(gradeLevel ? { tutorProfile: { user: { gradeLevel } } } : {}),
      ...(range ? { requestedAt: range } : {}),
    };
    const enrollmentScope: Prisma.ClassEnrollmentWhereInput = {
      ...(subject ? { class: { subject } } : {}),
      ...(gradeLevel ? { learner: { gradeLevel } } : {}),
    };
    const enrollmentWhere: Prisma.ClassEnrollmentWhereInput = {
      ...enrollmentScope,
      ...(range ? { enrolledAt: range } : {}),
    };

    const [
      usersByRole,
      usersByGradeLevel,
      usersByStatus,
      classesBySubject,
      classesByStatus,
      certificationsByStatus,
      totalEnrollments,
      currentEnrollments,
      trendRows,
      subjectRows,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], where: userWhere, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["gradeLevel"], where: userWhere, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["status"], where: userWhere, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["subject"], where: classWhere, _count: { _all: true } }),
      prisma.tutorClass.groupBy({ by: ["status"], where: classWhere, _count: { _all: true } }),
      prisma.topicCertification.groupBy({ by: ["status"], where: certificationWhere, _count: { _all: true } }),
      prisma.classEnrollment.count({ where: enrollmentWhere }),
      prisma.classEnrollment.count({ where: { withdrawnAt: null, ...enrollmentWhere } }),
      prisma.classEnrollment.findMany({
        where: { ...enrollmentScope, enrolledAt: { gte: trendStart, lt: trendEnd } },
        select: { enrolledAt: true },
      }),
      // Not narrowed by the filters, so the subject picker always offers every choice.
      prisma.tutorClass.findMany({ distinct: ["subject"], select: { subject: true }, orderBy: { subject: "asc" } }),
    ]);

    const bucket = trendDays > DAILY_BUCKET_MAX_DAYS ? "month" : "day";

    return NextResponse.json({
      filters: { from: from ?? null, to: to ?? null, role: role ?? null, gradeLevel: gradeLevel ?? null, subject: subject ?? null },
      subjectOptions: subjectRows.map((r) => r.subject),
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
      usersByGradeLevel: usersByGradeLevel.map((r) => ({ gradeLevel: r.gradeLevel, count: r._count._all })),
      usersByStatus: usersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      classesBySubject: classesBySubject.map((r) => ({ subject: r.subject, count: r._count._all })),
      classesByStatus: classesByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      certificationsByStatus: certificationsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      enrollments: {
        total: totalEnrollments,
        current: currentEnrollments,
        withdrawn: totalEnrollments - currentEnrollments,
        // Enrolments inside the charted period: the chosen range, or the last 30 days.
        inRange: trendRows.length,
        last30Days: trendRows.length,
        bucket,
        byDay: bucketEnrollments(trendRows, trendStart, trendDays, bucket),
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
