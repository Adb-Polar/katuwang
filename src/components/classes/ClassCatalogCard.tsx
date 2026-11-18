import type { ReactNode } from "react";
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
 * left. The tutor's own list (`/tutor/classes`) uses it too, with the class code, its own status
 * on the right (`aside`) and an admin's suspension reason (`notice`).
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
  code,
  aside,
  notice,
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
  /** Tutor list: the class code (e.g. "C-0007"), after subject and grade. */
  code?: string | null;
  /** Replaces the status / seats text at the bottom right (tutor list: enrolment, published, moderation). */
  aside?: ReactNode;
  /** A line under the topics, e.g. why an administrator suspended the class. */
  notice?: ReactNode;
}) {
  const now = new Date();
  const byTime = [...sessions].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const next = byTime.find((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > now);
  // Completed/cancelled classes have no next session; show the most recent one, muted.
  const dated = next ?? byTime[byTime.length - 1];
  const seatsLeft = Math.max(maxStudents - enrolledCount, 0);
  const [firstTopic = "", ...otherTopics] = topics.slice(0, MAX_TOPICS);
  const overflow = Math.max(topics.length - MAX_TOPICS, 0);

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
          {/* Each piece stays whole; a piece that doesn't fit moves to the next line. */}
          <span className="flex flex-wrap gap-x-1.5 text-sm text-(--kt-muted)">
            {[subjectDisplayLabel(subject), gradeLevel && `Grade ${gradeNumber(gradeLevel)}`, code]
              .filter(Boolean)
              .map((part, i) => (
                <span key={i} className="whitespace-nowrap">
                  {i > 0 && "· "}
                  {part}
                </span>
              ))}
          </span>
          {/* One title (the first topic); any other topics sit under it, one per line, in smaller sans. */}
          <span className="font-serif text-lg font-medium leading-snug">
            {firstTopic}
            {verifiedTopics.includes(firstTopic) && <VerifiedMark />}
          </span>
          {otherTopics.length > 0 && (
            <span className="flex flex-col gap-1 mt-1 pl-3 border-l-2 border-(--kt-border) text-sm leading-snug">
              {otherTopics.map((topic) => (
                <span key={topic}>
                  {topic}
                  {verifiedTopics.includes(topic) && <VerifiedMark />}
                </span>
              ))}
              {overflow > 0 && <span className="text-(--kt-muted)">+{overflow} more</span>}
            </span>
          )}
          {notice && <span className="text-sm text-error">{notice}</span>}
        </span>
      </span>

      <span className="mt-auto pt-3 border-t border-(--kt-border) flex items-end justify-between gap-3 text-sm">
        <span className="min-w-0 flex flex-col text-(--kt-muted)">
          {dated && (
            <span className="flex flex-wrap gap-x-1.5 tabular-nums">
              <span className="whitespace-nowrap font-medium text-base-content">{formatTime(dated.scheduledAt)}</span>
              <span className="whitespace-nowrap">· {dated.duration} min</span>
              {sessions.length > 1 && <span className="whitespace-nowrap">· {sessions.length} sessions</span>}
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
          {aside ?? (statusText ? (
            <span className={status === "COMPLETED" ? "text-(--kt-muted)" : "text-error"}>{statusText}</span>
          ) : showSeats ? (
            seatsLeft === 0 ? (
              <span className="text-error">Full</span>
            ) : (
              <span className="text-primary">
                {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
              </span>
            )
          ) : null)}
        </span>
      </span>
    </Link>
  );
}

function VerifiedMark() {
  return <Check className="inline h-3.5 w-3.5 ml-1 -mt-0.5 text-success" aria-label="verified tutor" />;
}
