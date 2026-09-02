// Weekly availability, auto-derived from a tutor's scheduled class sessions.
//
// This replaces the old hand-maintained `Availability` table. A tutor's real
// teaching calendar *is* their availability signal, so learners see when a tutor
// is actually active instead of a stale, self-reported schedule that was never
// enforced against class scheduling.

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

// Monday-first ordering for display.
const DISPLAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export interface DerivedSlot {
  day: string; // "MONDAY".."SUNDAY"
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
}

export interface SessionForDerivation {
  scheduledAt: Date | string;
  duration: number; // minutes
  status: string; // SessionStatus
}

function hhmm(totalMinutes: number): string {
  // Keep the window label within a single day even if a late session runs over.
  const capped = Math.min(Math.max(totalMinutes, 0), 24 * 60);
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Collapses a tutor's upcoming `SCHEDULED` sessions into a set of recurring
 * weekly windows. Overlapping or back-to-back sessions on the same weekday merge
 * into one window. Cancelled, completed, and past sessions are ignored.
 *
 * Day-of-week and time-of-day are read in the server's local timezone, matching
 * how `src/lib/matching.ts` interprets `scheduledAt`.
 */
export function deriveWeeklyAvailability(
  sessions: SessionForDerivation[],
  now: Date = new Date()
): DerivedSlot[] {
  const byDay = new Map<string, Array<[number, number]>>(); // day -> [startMin, endMin][]

  for (const s of sessions) {
    if (s.status !== "SCHEDULED") continue;
    const start = new Date(s.scheduledAt);
    if (Number.isNaN(start.getTime()) || start.getTime() <= now.getTime()) continue;

    const day = DAY_NAMES[start.getDay()];
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = startMin + Math.max(0, s.duration);

    const list = byDay.get(day) ?? [];
    list.push([startMin, endMin]);
    byDay.set(day, list);
  }

  const slots: DerivedSlot[] = [];

  for (const day of DISPLAY_ORDER) {
    const intervals = byDay.get(day);
    if (!intervals || intervals.length === 0) continue;

    intervals.sort((a, b) => a[0] - b[0]);
    let [curStart, curEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [s, e] = intervals[i];
      if (s <= curEnd) {
        curEnd = Math.max(curEnd, e);
      } else {
        slots.push({ day, startTime: hhmm(curStart), endTime: hhmm(curEnd) });
        [curStart, curEnd] = [s, e];
      }
    }
    slots.push({ day, startTime: hhmm(curStart), endTime: hhmm(curEnd) });
  }

  return slots;
}
