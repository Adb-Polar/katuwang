import Link from "next/link";
import { Check, EyeOff, AlertTriangle } from "lucide-react";
import StatusText from "@/components/ui/StatusText";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { getClassStatusBadge, ClassLifecycleStatus } from "./classStatus";
import UserAvatar from "@/components/profile/UserAvatar";
import { formatDateTime, formatWeekday } from "@/lib/datetime";
import { gradeLabel } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";

interface SessionLike {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export default function ClassCard({
  code,
  subject,
  gradeLevel,
  topics,
  verifiedTopics,
  description,
  sessions,
  status,
  published = true,
  suspendedReason,
  enrolledCount,
  maxStudents,
  activeLabel,
  tutorAnonymousId,
  tutorName,
  tutorSection,
  tutorImage,
  href,
}: {
  /** Human-friendly class code (e.g. "C-0007"); shown in the line above the subject when set. */
  code?: string | null;
  subject: string;
  /** Optional target grade (e.g. "GRADE_9"); shown beside the code when set. */
  gradeLevel?: string | null;
  topics: string[];
  /** Topics (from `topics`) the tutor has been verified for, shown with a check. */
  verifiedTopics?: string[];
  description: string | null;
  sessions: SessionLike[];
  status: ClassLifecycleStatus;
  /** Tutor-only: whether the class is visible to learners. Defaults to true (learner-facing cards never see unpublished classes). */
  published?: boolean;
  /** Tutor-only: admin's reason when the class is SUSPENDED/BANNED; surfaced on the card. */
  suspendedReason?: string | null;
  enrolledCount: number;
  maxStudents: number;
  activeLabel: string;
  /** Learner-facing: the teaching tutor's anonymised ID. When set, a tutor line is shown. */
  tutorAnonymousId?: string | null;
  /** Learner-facing: the tutor's real name — shown instead of the ID when `showTutorRealNames` is on. */
  tutorName?: string | null;
  /** Learner-facing: the tutor's section, shown as a muted suffix when `tutorName` is set. */
  tutorSection?: string | null;
  /** Learner-facing: the tutor's profile picture URL */
  tutorImage?: string | null;
  /** When set, the card renders as a link to this path (usable from Server Components). */
  href?: string;
}) {
  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, activeLabel);

  const now = new Date();
  const nextSession = sessions
    .filter((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const formattedDate = nextSession
    ? `${formatWeekday(nextSession.scheduledAt)}, ${formatDateTime(nextSession.scheduledAt)}`
    : null;

  const isModerated = status === "SUSPENDED" || status === "BANNED";

  // `card` keeps the portal's phone touch-target rule (`main a:not(.card)`) off the whole-card link.
  const cardClassName = `card kt-card cursor-pointer p-5 gap-3 transition-colors hover:border-primary/50 ${
    isModerated ? "border-error/40 bg-error/5" : published ? "" : "border-warning/50"
  }`;

  const MAX_TOPICS = 3;
  const shownTopics = topics.slice(0, MAX_TOPICS);
  const overflowCount = topics.length - shownTopics.length;
  const meta = [code, gradeLevel && gradeLabel(gradeLevel)].filter(Boolean);

  const inner = (
    <>
      <div className="flex flex-wrap justify-between items-start gap-x-3 gap-y-1">
        <div className="min-w-0">
          {meta.length > 0 && (
            <p className="flex flex-wrap gap-x-1.5 text-sm text-(--kt-muted)">
              {meta.map((part, i) => (
                <span key={i} className="whitespace-nowrap">
                  {i > 0 && "· "}
                  {part}
                </span>
              ))}
            </p>
          )}
          <h3 className="font-serif text-lg font-medium leading-snug break-words">{subjectDisplayLabel(subject)}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
          {!published && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-(--kt-warning-text)">
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              Unpublished
            </span>
          )}
          {/* An unpublished class isn't live, so don't also mark it "Active"/"Full".
              Real lifecycle states (Completed/Suspended/Banned/Cancelled) still show. */}
          {(published || status !== "SCHEDULED") && <StatusText tone={tone} label={label} />}
        </div>
      </div>

      {(shownTopics.length > 0 || description) && (
        <div className="space-y-1.5">
          {shownTopics.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {shownTopics.map((topic) => (
                <li key={topic} className="min-w-0 break-words">
                  {topic}
                  {verifiedTopics?.includes(topic) && (
                    <Check className="inline h-3.5 w-3.5 ml-1 -mt-0.5 text-success" aria-label="verified tutor" />
                  )}
                </li>
              ))}
              {overflowCount > 0 && <li className="text-(--kt-muted)">+{overflowCount} more</li>}
            </ul>
          )}
          {description && <p className="text-sm text-(--kt-muted) line-clamp-2">{description}</p>}
        </div>
      )}

      <div className="pt-3 border-t border-(--kt-border) flex flex-col gap-1 text-sm text-(--kt-muted)">
        <p className="flex flex-wrap gap-x-1.5 tabular-nums">
          {nextSession ? (
            <>
              <span className="whitespace-nowrap font-medium text-base-content">{formattedDate}</span>
              <span className="whitespace-nowrap">· {nextSession.duration} min</span>
            </>
          ) : (
            <span>No upcoming sessions</span>
          )}
          <span className="whitespace-nowrap">
            · {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </span>
          <span className="whitespace-nowrap">
            · {enrolledCount} / {maxStudents} enrolled
          </span>
        </p>
        {tutorAnonymousId && (
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar clickable={false}
              src={tutorImage}
              name={tutorName}
              anonymousId={tutorAnonymousId}
              size="xs"
              role="TUTOR"
              subtitle={tutorName && tutorSection ? `Section ${tutorSection}` : undefined}
            />
            <span className="truncate">
              with{" "}
              {tutorName ? (
                <span className="kt-id kt-id--tutor">{tutorName}</span>
              ) : (
                <AnonymousIdText id={tutorAnonymousId} role="TUTOR" />
              )}
              {tutorName && tutorSection && <span> · {tutorSection}</span>}
            </span>
          </div>
        )}
      </div>

      {isModerated && suspendedReason && (
        <p className="flex items-start gap-1.5 text-sm text-error">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{suspendedReason}</span>
        </p>
      )}
    </>
  );

  return href ? <Link href={href} className={cardClassName}>{inner}</Link>
    : <div className={cardClassName.replace("cursor-pointer ", "")}>{inner}</div>;
}
