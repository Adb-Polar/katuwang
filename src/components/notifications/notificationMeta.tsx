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
  Flag,
  Sparkles,
} from "lucide-react";
import { MINUTE_MS, formatDayMonth } from "@/lib/datetime";

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
  QUESTION_REQUEST_NEW: <ClipboardList className="h-4 w-4 text-info" />,
  QUESTION_REQUEST_RESOLVED: <CheckCheck className="h-4 w-4 text-success" />,
  QUESTION_REQUEST_DISMISSED: <XCircle className="h-4 w-4 text-base-content/40" />,
  // class enrolment (tutor-facing)
  CLASS_ENROLLMENT_NEW: <UserPlus className="h-4 w-4 text-info" />,
  CLASS_ENROLLMENT_DROPPED: <UserMinus className="h-4 w-4 text-warning" />,
  // class lifecycle (learner-facing)
  CLASS_CANCELLED: <CalendarX className="h-4 w-4 text-error" />,
  CLASS_COMPLETED: <CalendarCheck className="h-4 w-4 text-success" />,
  // class appeals — filed (admin-facing), reviewed (tutor-facing)
  CLASS_APPEAL_NEW: <Gavel className="h-4 w-4 text-warning" />,
  CLASS_APPEAL_APPROVED: <Gavel className="h-4 w-4 text-success" />,
  CLASS_APPEAL_REJECTED: <Gavel className="h-4 w-4 text-error" />,
  // abuse reports — filed (admin-facing), reviewed (reporter-facing)
  REPORT_NEW: <Flag className="h-4 w-4 text-warning" />,
  REPORT_REVIEWED: <Flag className="h-4 w-4 text-info" />,
  // session pre/post tests (learner-facing)
  SESSION_PRETEST_OPEN: <ClipboardList className="h-4 w-4 text-info" />,
  SESSION_POSTTEST_OPEN: <ClipboardList className="h-4 w-4 text-success" />,
  // admin-recommended class (distinct from the chatbot's own recommend feature)
  CLASS_RECOMMENDED_BY_ADMIN: <Sparkles className="h-4 w-4 text-secondary" />,
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
