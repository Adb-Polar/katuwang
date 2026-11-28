import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";
import { type AnalyticsChartId, chartTakes } from "@/lib/analyticsCharts";
import {
  type AdminAnalyticsQuery,
  DAILY_BUCKET_MAX_DAYS,
  DEFAULT_TREND_DAYS,
  adminAnalyticsQuerySchema,
  schoolDayStart,
} from "@/lib/validations/analytics";

const QUERY_KEYS = ["chart", "from", "to", "role", "gradeLevel", "subject"] as const;

type DateRange = { gte: Date; lt: Date };
type Breakdown = { count: number; [key: string]: string | number | null };

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

/** The query's filters with any the chart does not take dropped. */
function applicableFilters(query: AdminAnalyticsQuery) {
  const takes = (key: "role" | "gradeLevel" | "subject") => chartTakes(query.chart, key);
  return {
    role: takes("role") ? query.role : undefined,
    gradeLevel: takes("gradeLevel") ? query.gradeLevel : undefined,
    subject: takes("subject") ? query.subject : undefined,
  };
}

/** One groupBy per breakdown chart, flattened to `{ [field]: value, count }` rows. */
async function breakdownRows(chart: Exclude<AnalyticsChartId, "enrollments">, query: AdminAnalyticsQuery, range?: DateRange): Promise<Breakdown[]> {
  const { role, gradeLevel, subject } = applicableFilters(query);
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
  const count = { _count: { _all: true } } as const;

  switch (chart) {
    case "usersByRole":
      return (await prisma.user.groupBy({ by: ["role"], where: userWhere, ...count })).map((r) => ({ role: r.role, count: r._count._all }));
    case "usersByGradeLevel":
      return (await prisma.user.groupBy({ by: ["gradeLevel"], where: userWhere, ...count })).map((r) => ({ gradeLevel: r.gradeLevel, count: r._count._all }));
    case "usersByStatus":
      return (await prisma.user.groupBy({ by: ["status"], where: userWhere, ...count })).map((r) => ({ status: r.status, count: r._count._all }));
    case "classesBySubject":
      return (await prisma.tutorClass.groupBy({ by: ["subject"], where: classWhere, ...count })).map((r) => ({ subject: r.subject, count: r._count._all }));
    case "classesByStatus":
      return (await prisma.tutorClass.groupBy({ by: ["status"], where: classWhere, ...count })).map((r) => ({ status: r.status, count: r._count._all }));
    case "certificationsByStatus":
      return (await prisma.topicCertification.groupBy({ by: ["status"], where: certificationWhere, ...count })).map((r) => ({ status: r.status, count: r._count._all }));
  }
}

/** Enrolment cards and trend. With no range the counts are all-time and the trend covers the last 30 days. */
async function enrollmentSummary(query: AdminAnalyticsQuery, trendStart: Date, trendEnd: Date, range?: DateRange) {
  const { gradeLevel, subject } = applicableFilters(query);
  const scope: Prisma.ClassEnrollmentWhereInput = {
    ...(subject ? { class: { subject } } : {}),
    ...(gradeLevel ? { learner: { gradeLevel } } : {}),
  };
  const where: Prisma.ClassEnrollmentWhereInput = { ...scope, ...(range ? { enrolledAt: range } : {}) };
  const [total, current, trendRows] = await Promise.all([
    prisma.classEnrollment.count({ where }),
    prisma.classEnrollment.count({ where: { withdrawnAt: null, ...where } }),
    prisma.classEnrollment.findMany({
      where: { ...scope, enrolledAt: { gte: trendStart, lt: trendEnd } },
      select: { enrolledAt: true },
    }),
  ]);
  const trendDays = Math.round((trendEnd.getTime() - trendStart.getTime()) / DAY_MS);
  const bucket = trendDays > DAILY_BUCKET_MAX_DAYS ? "month" : "day";
  return {
    total,
    current,
    withdrawn: total - current,
    // Enrolments inside the charted period: the chosen range, or the last 30 days.
    inRange: trendRows.length,
    bucket,
    byDay: bucketEnrollments(trendRows, trendStart, trendDays, bucket),
  };
}

// ─── GET: One analytics chart for the admin dashboard ─────────────────────────
// `chart` picks the chart; from/to (school dates, inclusive), role, gradeLevel and subject filter it.
// Filters the chart does not take (see ANALYTICS_CHART_FILTERS) are ignored.
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const raw = Object.fromEntries(QUERY_KEYS.flatMap((key) => (params.get(key) ? [[key, params.get(key)!]] : [])));
    const parsed = adminAnalyticsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid filters." }, { status: 400 });
    }
    const query = parsed.data;
    const { chart, from, to } = query;

    const hasRange = Boolean(from && to);
    const today = parseLocalDateAndTime(new Date()).date;
    const trendStart = hasRange
      ? schoolDayStart(from!)
      : new Date(schoolDayStart(today).getTime() - (DEFAULT_TREND_DAYS - 1) * DAY_MS);
    const trendEnd = new Date(schoolDayStart(hasRange ? to! : today).getTime() + DAY_MS);
    const range = hasRange ? { gte: trendStart, lt: trendEnd } : undefined;

    const [data, subjectRows] = await Promise.all([
      chart === "enrollments"
        ? enrollmentSummary(query, trendStart, trendEnd, range).then((enrollments) => ({ enrollments }))
        : breakdownRows(chart, query, range).then((rows) => ({ rows })),
      // Not narrowed by the filters, so the subject picker always offers every choice.
      chartTakes(chart, "subject")
        ? prisma.tutorClass.findMany({ distinct: ["subject"], select: { subject: true }, orderBy: { subject: "asc" } })
        : null,
    ]);

    return NextResponse.json({
      chart,
      ...data,
      ...(subjectRows ? { subjectOptions: subjectRows.map((r) => r.subject) } : {}),
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
