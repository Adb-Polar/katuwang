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
// One presentation policy for the whole app. Locale follows the runtime.

/** e.g. "Aug 30, 2026". */
export function formatDate(input: DateInput): string {
  return asDate(input).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** e.g. "Aug 30" — day/month only, for dense lists where the year is implied. */
export function formatDayMonth(input: DateInput): string {
  return asDate(input).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** e.g. "Aug 30, 2026, 3:00 PM". */
export function formatDateTime(input: DateInput): string {
  return asDate(input).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** e.g. "3:00 PM". */
export function formatTime(input: DateInput): string {
  return asDate(input).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** e.g. "Mon". */
export function formatWeekday(input: DateInput): string {
  return asDate(input).toLocaleDateString(undefined, { weekday: "short" });
}
