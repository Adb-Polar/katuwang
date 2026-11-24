import { MINUTE_MS, formatTime } from "@/lib/datetime";
import { findOverlap, type TimedRange } from "@/lib/timeRanges";

export const MIN_SESSION_MINUTES = 15;
export const MAX_SESSION_MINUTES = 240;
const MINUTES_PER_HOUR = 60;

/** What the scheduling form edits: a local calendar date plus start/end clock times. */
export interface SessionTimeValue {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` (24h) */
  startTime: string;
  /** `HH:MM` (24h) */
  endTime: string;
}

export const EMPTY_SESSION_TIME: SessionTimeValue = { date: "", startTime: "", endTime: "" };

/** A session the tutor already has booked, labelled for display in the form. */
export interface BusySlot extends TimedRange {
  id: string;
  classCode: string;
  topic: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` in the runtime's local zone — the format `<input type="date">` uses. */
export function toLocalDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `HH:MM` in the runtime's local zone — the format `<input type="time">` uses. */
export function toLocalTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a stored session (start instant + minutes) into form fields. */
export function sessionTimeFromRange(scheduledAt: Date | string, duration: number): SessionTimeValue {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + duration * MINUTE_MS);
  return { date: toLocalDateInput(start), startTime: toLocalTimeInput(start), endTime: toLocalTimeInput(end) };
}

/**
 * Converts form fields into the stored shape. Returns `null` while any field
 * is blank or unparseable. `duration` can be zero or negative when the end
 * time is not after the start — `sessionTimeError` reports that.
 */
export function resolveSessionTime(value: SessionTimeValue): { scheduledAt: Date; duration: number } | null {
  if (!value.date || !value.startTime || !value.endTime) return null;
  const start = new Date(`${value.date}T${value.startTime}`);
  const end = new Date(`${value.date}T${value.endTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { scheduledAt: start, duration: Math.round((end.getTime() - start.getTime()) / MINUTE_MS) };
}

/** e.g. `45m`, `1h`, `1h 30m`. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** e.g. `9:00 AM–10:00 AM`. */
export function formatTimeRange(range: TimedRange): string {
  const start = new Date(range.scheduledAt);
  return `${formatTime(start)}–${formatTime(new Date(start.getTime() + range.duration * MINUTE_MS))}`;
}

/** The busy slots that start on the given local `YYYY-MM-DD` date. */
export function busySlotsOn(date: string, busy: BusySlot[]): BusySlot[] {
  return busy.filter((slot) => toLocalDateInput(new Date(slot.scheduledAt)) === date);
}

/**
 * The first problem with a session time, or `null` when it is valid or still
 * incomplete. Mirrors the server rules (past date, 15–240 min, no overlap with
 * the tutor's other sessions) so the form can flag them before submitting.
 */
export function sessionTimeError(
  value: SessionTimeValue,
  context: { now: Date; busy?: BusySlot[]; siblings?: TimedRange[] }
): string | null {
  const resolved = resolveSessionTime(value);
  if (!resolved) return null;

  if (resolved.duration <= 0) return "End time must be after the start time.";
  if (resolved.duration < MIN_SESSION_MINUTES) {
    return `A session must be at least ${MIN_SESSION_MINUTES} minutes long.`;
  }
  if (resolved.duration > MAX_SESSION_MINUTES) {
    return `A session cannot be longer than ${formatDuration(MAX_SESSION_MINUTES)}.`;
  }
  if (resolved.scheduledAt.getTime() <= context.now.getTime()) {
    return "This date and time is already in the past.";
  }

  const clash = findOverlap(resolved, context.busy ?? []);
  if (clash) {
    return `You already have ${clash.classCode} (${clash.topic}) at ${formatTimeRange(clash)}.`;
  }
  if (findOverlap(resolved, context.siblings ?? [])) {
    return "This overlaps another session in this form.";
  }
  return null;
}
