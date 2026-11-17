import type { ReactNode } from "react";
import { Calendar, Clock } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getSessionStatusBadge, SessionLifecycleStatus } from "./classStatus";
import { formatDateTime, formatTime, SCHOOL_TIME_ZONE } from "@/lib/datetime";

const dateParts = new Intl.DateTimeFormat("en-PH", { timeZone: SCHOOL_TIME_ZONE, weekday: "short", day: "numeric", month: "short" });

/** Calendar-style rows: a serif day number beside each session (class detail pages). */
function CalendarSessions({ sessions, renderActions }: { sessions: SessionSummary[]; renderActions?: (session: SessionSummary) => ReactNode }) {
  if (sessions.length === 0) return <p className="py-3 text-sm text-(--kt-muted)">No sessions scheduled yet.</p>;
  return (
    <ol>
      {sessions.map((s) => {
        const p = Object.fromEntries(dateParts.formatToParts(new Date(s.scheduledAt)).map((x) => [x.type, x.value]));
        const { tone, label } = getSessionStatusBadge(s.status);
        return (
          <li key={s.id} className="flex gap-4 py-4 border-b border-(--kt-border) last:border-b-0">
            <time dateTime={s.scheduledAt} className="w-12 shrink-0 flex flex-col items-center text-center">
              <span className="sr-only">{formatDateTime(s.scheduledAt)}</span>
              <span aria-hidden="true" className="text-sm text-(--kt-muted)">{p.weekday}</span>
              <span aria-hidden="true" className="font-serif text-2xl leading-tight">{p.day}</span>
              <span aria-hidden="true" className="text-sm text-(--kt-muted)">{p.month}</span>
            </time>
            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
              <p className="font-medium break-words">{s.topic}</p>
              <p className="text-sm text-(--kt-muted)">{formatTime(s.scheduledAt)} · {s.duration} min</p>
              {s.status !== "SCHEDULED" && <StatusBadge tone={tone} label={label} size="sm" />}
              {renderActions && <div className="mt-1">{renderActions(s)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface SessionSummary {
  id: string;
  topic: string;
  scheduledAt: string;
  duration: number;
  status: SessionLifecycleStatus;
}

export default function SessionsList({
  sessions,
  renderActions,
  variant = "list",
}: {
  sessions: SessionSummary[];
  /** "calendar" = date-led rows for class detail pages; "list" = the compact boxed rows used in forms. */
  variant?: "list" | "calendar";
  /** Per-session controls (tutor only) — e.g. Mark Complete / Cancel / Reschedule. */
  renderActions?: (session: SessionSummary) => ReactNode;
}) {
  if (variant === "calendar") return <CalendarSessions sessions={sessions} renderActions={renderActions} />;
  if (sessions.length === 0) {
    return (
      <p className="text-2xs text-(--kt-faint) italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        No sessions scheduled yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const { tone, label } = getSessionStatusBadge(s.status);
        return (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs"
          >
            <div className="min-w-0 max-w-full space-y-1">
              <div className="font-semibold text-(--kt-muted) break-words">{s.topic}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-(--kt-faint)">
                <span className="flex min-w-0 items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(s.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {s.duration} minutes
                </span>
              </div>
            </div>
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <StatusBadge tone={tone} label={label} size="xs" />
              {renderActions?.(s)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
