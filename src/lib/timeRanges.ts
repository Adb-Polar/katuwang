import { MINUTE_MS } from "@/lib/datetime";

/** A session-shaped time range: a start instant plus a length in minutes. */
export interface TimedRange {
  scheduledAt: Date | string;
  duration: number;
}

const startMs = (r: TimedRange) => new Date(r.scheduledAt).getTime();
const endMs = (r: TimedRange) => startMs(r) + r.duration * MINUTE_MS;

/** True when the two half-open ranges [start, end) share any instant. */
export function rangesOverlap(a: TimedRange, b: TimedRange): boolean {
  return startMs(a) < endMs(b) && endMs(a) > startMs(b);
}

/** The first range in `others` that overlaps `candidate`, or `undefined`. */
export function findOverlap<T extends TimedRange>(candidate: TimedRange, others: T[]): T | undefined {
  return others.find((other) => rangesOverlap(candidate, other));
}

/** True when any two ranges in the batch overlap each other. */
export function hasPairwiseOverlap(ranges: TimedRange[]): boolean {
  return ranges.some((range, i) => findOverlap(range, ranges.slice(i + 1)) !== undefined);
}
