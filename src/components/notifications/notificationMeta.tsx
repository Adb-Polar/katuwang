import type { ReactNode } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  UserPlus,
  UserMinus,
  PartyPopper,
  BadgeCheck,
  XCircle,
  LogIn,
  CalendarX,
  CalendarCheck,
  Gavel,
  ClipboardList,
} from "lucide-react";

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

export const FALLBACK_ICON: ReactNode = <Bell className="h-4 w-4 text-base-content/40" />;

export const TYPE_ICON: Record<string, ReactNode> = {
  // topic requests
  TOPIC_REQUEST_DIRECTED: <UserPlus className="h-4 w-4 text-info" />,
  TOPIC_REQUEST_ACCEPTED: <PartyPopper className="h-4 w-4 text-success" />,
  TOPIC_REQUEST_REOPENED: <RefreshCw className="h-4 w-4 text-warning" />,
  TOPIC_REQUEST_FULFILLED: <CheckCheck className="h-4 w-4 text-success" />,
  // registration moderation
  REGISTRATION_APPROVED: <LogIn className="h-4 w-4 text-success" />,
  REGISTRATION_REJECTED: <XCircle className="h-4 w-4 text-error" />,
  // topic certification review
  CERTIFICATION_CERTIFIED: <BadgeCheck className="h-4 w-4 text-success" />,
  CERTIFICATION_REJECTED: <XCircle className="h-4 w-4 text-error" />,
  // question-bank requests
  QUESTION_REQUEST_RESOLVED: <CheckCheck className="h-4 w-4 text-success" />,
  QUESTION_REQUEST_DISMISSED: <XCircle className="h-4 w-4 text-base-content/40" />,
  // class enrolment (tutor-facing)
  CLASS_ENROLLMENT_NEW: <UserPlus className="h-4 w-4 text-info" />,
  CLASS_ENROLLMENT_DROPPED: <UserMinus className="h-4 w-4 text-warning" />,
  // class lifecycle (learner-facing)
  CLASS_CANCELLED: <CalendarX className="h-4 w-4 text-error" />,
  CLASS_COMPLETED: <CalendarCheck className="h-4 w-4 text-success" />,
  // class appeal review (tutor-facing)
  CLASS_APPEAL_APPROVED: <Gavel className="h-4 w-4 text-success" />,
  CLASS_APPEAL_REJECTED: <Gavel className="h-4 w-4 text-error" />,
  // session pre/post tests (learner-facing)
  SESSION_PRETEST_OPEN: <ClipboardList className="h-4 w-4 text-info" />,
  SESSION_POSTTEST_OPEN: <ClipboardList className="h-4 w-4 text-success" />,
};

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
