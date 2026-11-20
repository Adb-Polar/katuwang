import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";

export const DEFAULT_RANGE_DAYS = 90;
export const MAX_RANGE_DAYS = 366;

export interface ReportRange {
  /** Inclusive Philippine-time dates, "YYYY-MM-DD". */
  from: string;
  to: string;
  /** UTC instants: `gte` start, `lt` end (end = the day after `to`). */
  start: Date;
  end: Date;
}

const phMidnight = (date: string) => new Date(`${date}T00:00:00+08:00`);
const isRealDate = (date: string) => !Number.isNaN(phMidnight(date).getTime()) && parseLocalDateAndTime(phMidnight(date)).date === date;

/**
 * Resolves an optional from/to pair (school time zone) into query bounds.
 * Missing `to` → today; missing `from` → the 90 days ending at `to`.
 */
export function resolveReportRange(from?: string, to?: string, now: Date = new Date()): ReportRange | { error: string } {
  const toDate = to ?? parseLocalDateAndTime(now).date;
  if (!isRealDate(toDate)) return { error: "Invalid end date." };
  const fromDate = from ?? parseLocalDateAndTime(new Date(phMidnight(toDate).getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_MS)).date;
  if (!isRealDate(fromDate)) return { error: "Invalid start date." };

  const start = phMidnight(fromDate);
  const end = new Date(phMidnight(toDate).getTime() + DAY_MS);
  if (start >= end) return { error: "The start date must be on or before the end date." };
  if ((end.getTime() - start.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
    return { error: `The date range can be at most ${MAX_RANGE_DAYS} days.` };
  }
  return { from: fromDate, to: toDate, start, end };
}

/** Prisma `DateTime` filter for the range. */
export const inRange = (range: ReportRange) => ({ gte: range.start, lt: range.end });
