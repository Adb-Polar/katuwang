import type { ReactNode } from "react";
import { Calendar, Clock } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getSessionStatusBadge, SessionLifecycleStatus } from "./classStatus";
import { formatDateTime } from "@/lib/datetime";

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
}: {
  sessions: SessionSummary[];
  /** Per-session controls (tutor only) — e.g. Mark Complete / Cancel / Reschedule. */
  renderActions?: (session: SessionSummary) => ReactNode;
}) {
  if (sessions.length === 0) {
    return (
      <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
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
            <div className="min-w-0 space-y-1">
              <div className="font-semibold text-base-content/80 truncate">{s.topic}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-base-content/50">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(s.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {s.duration} minutes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge tone={tone} label={label} size="xs" />
              {renderActions?.(s)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
