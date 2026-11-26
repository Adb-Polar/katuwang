import { MINUTE_MS } from "@/lib/datetime";

type Instant = Date | string | number;

/** Pure and client-safe, so the schedule form and the server checks agree on what "overlap" means. */
export function rangesOverlap(startA: Instant, minutesA: number, startB: Instant, minutesB: number): boolean {
  const a = new Date(startA).getTime();
  const b = new Date(startB).getTime();
  return a < b + minutesB * MINUTE_MS && a + minutesA * MINUTE_MS > b;
}
