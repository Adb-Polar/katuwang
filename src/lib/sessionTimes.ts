import { combineDateAndTime, formatTime, parseLocalDateAndTime } from "@/lib/datetime";
import { rangesOverlap } from "@/lib/sessionOverlap";

/** Mirrors `sessionSchema` in validations/class.ts. */
export const MIN_SESSION_MINUTES = 15;
export const MAX_SESSION_MINUTES = 240;
export const DEFAULT_SESSION_MINUTES = 60;

const DAY_MINUTES = 24 * 60;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** A session already on the tutor's calendar, as the schedule forms need it. */
export interface BusySession {
  id: string;
  scheduledAt: string;
  duration: number;
  /** e.g. "Chemistry 3 · C-0002" */
  label: string;
}

function timeToMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** "14:30" + 90 → "16:00". Wraps past midnight, because a late session may end the next day. */
export function addMinutesToTime(time: string, minutes: number): string {
  const start = timeToMinutes(time);
  if (start === null) return "";
  const total = (((start + minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Minutes from start to end; an end at or before the start is read as the next day. */
export function sessionMinutes(start: string, end: string): number | null {
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (from === null || to === null) return null;
  return to > from ? to - from : to - from + DAY_MINUTES;
}

/** Empty when the start/end pair is a session length the server accepts. */
export function sessionLengthError(start: string, end: string): string {
  const minutes = sessionMinutes(start, end);
  if (minutes === null) return "";
  if (minutes > MAX_SESSION_MINUTES) {
    return end <= start ? "End time must be after the start time." : "A session cannot be longer than 4 hours.";
  }
  if (minutes < MIN_SESSION_MINUTES) return `A session must be at least ${MIN_SESSION_MINUTES} minutes long.`;
  return "";
}

/** 90 → "1 hr 30 min". */
export function formatSessionLength(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} hr` : "", rest ? `${rest} min` : ""].filter(Boolean).join(" ") || "0 min";
}

/** Today's date in the school time zone, for `<input type="date" min>`. */
export function todayInSchoolZone(now: Date = new Date()): string {
  return parseLocalDateAndTime(now).date;
}

export interface ScheduleCandidate {
  date: string;
  time: string;
  duration: number;
}

/**
 * The reason a session cannot be scheduled as entered — already past, or overlapping a
 * session the tutor already has — so the form can say so before it is submitted.
 * The server runs the same checks and stays the source of truth.
 */
export function scheduleProblem(candidate: ScheduleCandidate, busy: readonly BusySession[], now: Date = new Date()): string {
  const startIso = combineDateAndTime(candidate.date, candidate.time);
  if (!startIso) return "";
  if (new Date(startIso).getTime() <= now.getTime()) return "This date and time has already passed.";
  const clash = busy.find((other) => rangesOverlap(startIso, candidate.duration, other.scheduledAt, other.duration));
  if (!clash) return "";
  const clashEnd = new Date(new Date(clash.scheduledAt).getTime() + clash.duration * 60_000);
  return `You already have ${clash.label} from ${formatTime(clash.scheduledAt)} to ${formatTime(clashEnd)} on this date.`;
}
