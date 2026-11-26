import type { ReactNode } from "react";
import { Bell, BookOpen, CalendarDays, ClipboardList, Flag, UserRound } from "lucide-react";
import { MINUTE_MS, formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { scheduleDate } from "@/lib/scheduleDates";

// Shared shape + presentation helpers for notifications, used by both the
// full-page NotificationList and the topbar NotificationBell dropdown.

export interface NotificationRow {
  id: string;
  type: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

// One quiet icon per kind of notification (the message says what happened), inheriting the text colour.
const icon = (I: typeof Bell) => <I aria-hidden="true" className="h-4 w-4" />;
const CLASS = icon(CalendarDays);
const TEST = icon(ClipboardList);
const REQUEST = icon(BookOpen);
const MODERATION = icon(Flag);
const ACCOUNT = icon(UserRound);

export const FALLBACK_ICON: ReactNode = icon(Bell);

/** What a notification is about, shown as a plain word before its time in the full-page list. */
export type NotificationKind = "Class" | "Test" | "Request" | "Report" | "Account" | "Update";

export function notificationKind(type: string): NotificationKind {
  if (type.startsWith("CLASS_APPEAL") || type.startsWith("REPORT_")) return "Report";
  if (type.startsWith("CLASS_")) return "Class";
  if (type.startsWith("SESSION_") || type.startsWith("QUESTION_REQUEST")) return "Test";
  if (type.startsWith("TOPIC_REQUEST")) return "Request";
  if (type.startsWith("REGISTRATION_") || type.startsWith("CERTIFICATION_") || type.startsWith("PROFILE_PICTURE")) return "Account";
  return "Update";
}

export const TYPE_ICON: Record<string, ReactNode> = {
  TOPIC_REQUEST_DIRECTED: REQUEST,
  TOPIC_REQUEST_ACCEPTED: REQUEST,
  TOPIC_REQUEST_REOPENED: REQUEST,
  TOPIC_REQUEST_FULFILLED: REQUEST,
  QUESTION_REQUEST_NEW: TEST,
  QUESTION_REQUEST_RESOLVED: TEST,
  QUESTION_REQUEST_DISMISSED: TEST,
  SESSION_PRETEST_OPEN: TEST,
  SESSION_POSTTEST_OPEN: TEST,
  CLASS_ENROLLMENT_NEW: CLASS,
  CLASS_ENROLLMENT_DROPPED: CLASS,
  CLASS_CANCELLED: CLASS,
  CLASS_COMPLETED: CLASS,
  CLASS_RECOMMENDED_BY_ADMIN: CLASS,
  CLASS_APPEAL_NEW: MODERATION,
  CLASS_APPEAL_APPROVED: MODERATION,
  CLASS_APPEAL_REJECTED: MODERATION,
  REPORT_NEW: MODERATION,
  REPORT_REVIEWED: MODERATION,
  CONTACT_MESSAGE_NEW: MODERATION,
  REGISTRATION_APPROVED: ACCOUNT,
  REGISTRATION_REJECTED: ACCOUNT,
  CERTIFICATION_CERTIFIED: ACCOUNT,
  CERTIFICATION_REJECTED: ACCOUNT,
  PROFILE_PICTURE_WARNING: ACCOUNT,
  PROFILE_PICTURE_REMOVED: ACCOUNT,
  PROFILE_PICTURE_LOCKED: ACCOUNT,
  PROFILE_PICTURE_UNLOCKED: ACCOUNT,
};

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / MINUTE_MS);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDayMonth(iso);
}

/** When a notification arrived: the time today, otherwise the Philippine day first ("Yesterday · 02:40 PM", "Sat, Nov 14 · 08:40 AM"). */
export function notificationWhen(iso: string, now: Date = new Date()): string {
  const day = scheduleDate(iso);
  const time = formatTime(iso);
  if (day === scheduleDate(now)) return time;
  if (day === scheduleDate(new Date(now.getTime() - 24 * 60 * MINUTE_MS))) return `Yesterday · ${time}`;
  return `${formatWeekday(iso)}, ${formatDayMonth(iso)} · ${time}`;
}
