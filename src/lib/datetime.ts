/** Shared date/time formatting helpers. */

/** e.g. "August 30, 2026 at 3:00 PM" — used on moderation/status panels. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}
