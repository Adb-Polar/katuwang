/** Shared date/time constants, arithmetic, and formatting helpers. */

type DateInput = string | number | Date;

const asDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value));

// ─── Duration constants ──────────────────────────────────────────────────────
export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Fractional days from `from` to `to` (negative if `to` precedes `from`). */
export const daysBetween = (from: DateInput, to: DateInput): number =>
  (asDate(to).getTime() - asDate(from).getTime()) / DAY_MS;

/** A new Date `n` days after `date` (`n` may be negative or fractional). */
export const addDays = (date: DateInput, n: number): Date =>
  new Date(asDate(date).getTime() + n * DAY_MS);

// ─── Formatting ──────────────────────────────────────────────────────────────
// One presentation policy for the whole app. Pinned to Philippine Time (Asia/Manila).
export const APP_TIMEZONE = "Asia/Manila";

/** e.g. "Aug 30, 2026". */
export function formatDate(input: DateInput): string {
  return asDate(input).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/** e.g. "Aug 30" — day/month only, for dense lists where the year is implied. */
export function formatDayMonth(input: DateInput): string {
  return asDate(input).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/** e.g. "Aug 30, 2026, 3:00 PM". */
export function formatDateTime(input: DateInput): string {
  return asDate(input).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIMEZONE,
  });
}

/** e.g. "3:00 PM". */
export function formatTime(input: DateInput): string {
  return asDate(input).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

/** e.g. "Mon". */
export function formatWeekday(input: DateInput): string {
  return asDate(input).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: APP_TIMEZONE,
  });
}
