import { GradeLevel } from "@prisma/client";
import { DAY_MS } from "@/lib/datetime";

/** Enrollment-trend window used when no date range is chosen. */
export const DEFAULT_TREND_DAYS = 30;
/** Longest date range the analytics API will bucket day by day. */
export const MAX_REPORT_RANGE_DAYS = 366;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_SUBJECT_LENGTH = 64;

export interface ReportFilters {
  /** Start of the first day, or `null` for all time. */
  from: Date | null;
  /** End of the last day, or `null` for all time. */
  to: Date | null;
  gradeLevel: GradeLevel | null;
  subject: string | null;
  /** The day-by-day enrollment window: the chosen range, else the last 30 days. */
  trendFrom: Date;
  trendDays: number;
}

export type ReportFiltersResult = { ok: true; filters: ReportFilters } | { ok: false; error: string };

/** `YYYY-MM-DD` → local midnight, or `null` if it is not a real calendar date. */
function parseLocalDate(raw: string): Date | null {
  const match = ISO_DATE.exec(raw);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const wholeDaysBetween = (from: Date, to: Date) => Math.round((startOfDay(to).getTime() - from.getTime()) / DAY_MS) + 1;

/**
 * Validates the analytics query string (`from`, `to`, `gradeLevel`, `subject`).
 * `from`/`to` come as a pair or not at all; without them the breakdowns cover
 * all time and the enrollment trend falls back to the last 30 days.
 */
export function parseReportFilters(params: { get(name: string): string | null }, now: Date): ReportFiltersResult {
  const fromRaw = params.get("from");
  const toRaw = params.get("to");
  const gradeRaw = params.get("gradeLevel");
  const subjectRaw = params.get("subject")?.trim() || null;

  if (gradeRaw && !(gradeRaw in GradeLevel)) return { ok: false, error: "Invalid grade level." };
  if (subjectRaw && subjectRaw.length > MAX_SUBJECT_LENGTH) return { ok: false, error: "Invalid subject." };
  const shared = { gradeLevel: (gradeRaw as GradeLevel | null) || null, subject: subjectRaw };

  if (!fromRaw && !toRaw) {
    const trendFrom = new Date(startOfDay(now).getTime() - (DEFAULT_TREND_DAYS - 1) * DAY_MS);
    return { ok: true, filters: { ...shared, from: null, to: null, trendFrom, trendDays: DEFAULT_TREND_DAYS } };
  }
  if (!fromRaw || !toRaw) return { ok: false, error: "Provide both a start date and an end date." };

  const from = parseLocalDate(fromRaw);
  const toDay = parseLocalDate(toRaw);
  if (!from || !toDay) return { ok: false, error: "Dates must be valid and formatted as YYYY-MM-DD." };
  if (from.getTime() > toDay.getTime()) return { ok: false, error: "The start date must not be after the end date." };

  const trendDays = wholeDaysBetween(from, toDay);
  if (trendDays > MAX_REPORT_RANGE_DAYS) {
    return { ok: false, error: `The date range cannot be longer than ${MAX_REPORT_RANGE_DAYS} days.` };
  }

  return { ok: true, filters: { ...shared, from, to: endOfDay(toDay), trendFrom: from, trendDays } };
}

/** `YYYY-MM-DD` for a local date — the bucket key of the daily series. */
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Counts `dates` into a zero-filled series of `days` consecutive local days starting at `from`. */
export function bucketByDay(dates: Date[], from: Date, days: number): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    counts.set(localDayKey(day), 0);
  }
  for (const date of dates) {
    const key = localDayKey(date);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}
