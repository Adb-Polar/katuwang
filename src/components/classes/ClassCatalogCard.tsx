import Link from "next/link";
import { Check } from "lucide-react";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { scheduleDate } from "@/lib/scheduleDates";
import { gradeNumber } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import type { ClassLifecycleStatus } from "./classStatus";

interface SessionLike {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

const MAX_TOPICS = 3;

/**
 * One class in a learner's catalog (Browse classes, My classes): a flat card led by its next
 * session as a small calendar date — the same style as the dashboard's week. The facts a
 * student decides on come first: when, which topic, who teaches it, and (when browsing) seats
 * left. Tutor-facing lists keep `ClassCard`.
 */
export default function ClassCatalogCard({
  href,
  subject,
  gradeLevel,
  topics,
  verifiedTopics = [],
  sessions,
  status,
  enrolledCount,
  maxStudents,
  tutorAnonymousId,
  tutorName,
  tutorSection,
  showSeats,
}: {
  href: string;
  subject: string;
  gradeLevel?: string | null;
  topics: string[];
  verifiedTopics?: string[];
  sessions: SessionLike[];
  status: ClassLifecycleStatus;
  enrolledCount: number;
  maxStudents: number;
  tutorAnonymousId?: string | null;
  /** Only present when the school shows tutor names (`showTutorRealNames`). */
  tutorName?: string | null;
  tutorSection?: string | null;
  /** Browsing: show seats left / Full. My classes: show the class status instead. */
  showSeats: boolean;
}) {
  const now = new Date();
  const byTime = [...sessions].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const next = byTime.find((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > now);
  // Completed/cancelled classes have no next session; show the most recent one, muted.
  const dated = next ?? byTime[byTime.length - 1];
  const seatsLeft = Math.max(maxStudents - enrolledCount, 0);
  const shownTopics = topics.slice(0, MAX_TOPICS);
  const overflow = topics.length - shownTopics.length;

  const statusText =
    status !== "SCHEDULED"
      ? status === "COMPLETED" ? "Completed" : status === "CANCELLED" ? "Cancelled" : "Unavailable"
      : null;

  return (
    <Link
      href={href}
      // flex!: the portal's phone touch-target rule turns links into one centred row.
      className="kt-card flex! flex-col! items-stretch! h-full p-5 gap-4 hover:border-primary/50 transition-colors"
    >
      <span className="flex items-start gap-4">
        <span className={`w-12 shrink-0 flex flex-col items-center text-center ${next ? "" : "opacity-70"}`}>
          {dated ? (
            <>
              <span className="text-xs font-medium text-(--kt-muted)">{formatWeekday(dated.scheduledAt)}</span>
              <span className="font-serif text-2xl leading-tight">{Number(scheduleDate(dated.scheduledAt).slice(-2))}</span>
              <span className="text-xs text-(--kt-muted)">{formatDayMonth(dated.scheduledAt).split(" ")[0]}</span>
            </>
          ) : (
            <span className="text-xs text-(--kt-muted) pt-2">No date yet</span>
          )}
        </span>

        <span className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Hierarchy: what you'd learn (topic) is the title; subject and grade label it. */}
          <span className="text-sm text-(--kt-muted)">
            {subjectDisplayLabel(subject)}
            {gradeLevel && ` · Grade ${gradeNumber(gradeLevel)}`}
          </span>
          <span className="font-serif text-lg font-medium leading-snug">
            {shownTopics.map((topic, i) => (
              <span key={topic}>
                {i > 0 && <span className="text-(--kt-muted) font-normal"> · </span>}
                {topic}
                {verifiedTopics.includes(topic) && (
                  <Check className="inline h-3.5 w-3.5 ml-0.5 -mt-0.5 text-success" aria-label="verified tutor" />
                )}
              </span>
            ))}
            {overflow > 0 && <span className="font-sans text-sm font-normal text-(--kt-muted)"> +{overflow} more</span>}
          </span>
        </span>
      </span>

      <span className="mt-auto pt-3 border-t border-(--kt-border) flex items-end justify-between gap-3 text-sm">
        <span className="min-w-0 flex flex-col text-(--kt-muted)">
          {dated && (
            <span className="tabular-nums">
              <span className="font-medium text-base-content">{formatTime(dated.scheduledAt)}</span>
              {` · ${dated.duration} min`}
              {sessions.length > 1 && ` · ${sessions.length} sessions`}
            </span>
          )}
          {tutorAnonymousId && (
            <span className="truncate">
              with <span className="kt-id kt-id--tutor">{tutorName || tutorAnonymousId}</span>
              {tutorName && tutorSection && <span> · {tutorSection}</span>}
            </span>
          )}
        </span>
        <span className="shrink-0 font-medium">
          {statusText ? (
            <span className={status === "COMPLETED" ? "text-(--kt-muted)" : "text-error"}>{statusText}</span>
          ) : showSeats ? (
            seatsLeft === 0 ? (
              <span className="text-error">Full</span>
            ) : (
              <span className="text-primary">
                {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
              </span>
            )
          ) : null}
        </span>
      </span>
    </Link>
  );
}
