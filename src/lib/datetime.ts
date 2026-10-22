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

// ─── Input Parsing & Serialization ──────────────────────────────────────────

/**
 * Splits a date-time input (ISO string, Date object, or "YYYY-MM-DDTHH:mm")
 * into local date ("YYYY-MM-DD") and local time ("HH:mm") strings suitable
 * for HTML `<input type="date">` and `<input type="time">`.
 */
export function parseLocalDateAndTime(val?: DateInput | null): { date: string; time: string } {
  if (!val) return { date: "", time: "" };

  if (
    typeof val === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val) &&
    !val.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(val)
  ) {
    const [d, t] = val.split("T");
    return { date: d, time: t.slice(0, 5) };
  }

  const d = asDate(val);
  if (isNaN(d.getTime())) return { date: "", time: "" };

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

/**
 * Combines a local date string ("YYYY-MM-DD") and a local time string ("HH:mm")
 * into a UTC ISO string ("YYYY-MM-DDTHH:mm:00.000Z") for API transmission.
 * Returns null if either component is missing or invalid.
 */
export function combineDateAndTime(date?: string | null, time?: string | null): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
