import { z } from "zod";
import { GradeLevel } from "@prisma/client";
import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";
import { ANALYTICS_CHART_IDS } from "@/lib/analyticsCharts";

export const MAX_ANALYTICS_RANGE_DAYS = 366;
/** Longer ranges are charted per month, so the trend stays readable. */
export const DAILY_BUCKET_MAX_DAYS = 92;
export const DEFAULT_TREND_DAYS = 30;

/** Midnight in the school time zone (fixed UTC+08:00) for a YYYY-MM-DD date. */
export function schoolDayStart(date: string): Date {
  return new Date(`${date}T00:00:00+08:00`);
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in the form YYYY-MM-DD.")
  // Round-trips, so "2026-02-31" (which Date would roll into March) is rejected.
  .refine((value) => parseLocalDateAndTime(schoolDayStart(value)).date === value, "Enter a real calendar date.");

/** `GET /api/admin/reports` query: which chart, plus its filters. A date range needs both ends; every filter is optional. */
export const adminAnalyticsQuerySchema = z
  .object({
    chart: z.enum(ANALYTICS_CHART_IDS, { message: "Choose a chart." }),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    role: z.enum(["STUDENT_LEARNER", "STUDENT_TUTOR"], { message: "Invalid role filter." }).optional(),
    gradeLevel: z.nativeEnum(GradeLevel, { message: "Invalid grade level filter." }).optional(),
    subject: z.string().trim().min(1).max(191, "Invalid subject filter.").optional(),
  })
  .superRefine(({ from, to }, ctx) => {
    if (!from && !to) return;
    if (!from || !to) {
      ctx.addIssue({ code: "custom", path: [from ? "to" : "from"], message: "Choose both a start and an end date." });
      return;
    }
    const days = Math.round((schoolDayStart(to).getTime() - schoolDayStart(from).getTime()) / DAY_MS) + 1;
    if (days < 1) ctx.addIssue({ code: "custom", path: ["to"], message: "The end date must not be before the start date." });
    else if (days > MAX_ANALYTICS_RANGE_DAYS) {
      ctx.addIssue({ code: "custom", path: ["to"], message: `Choose a range of at most ${MAX_ANALYTICS_RANGE_DAYS} days.` });
    }
  });

export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
