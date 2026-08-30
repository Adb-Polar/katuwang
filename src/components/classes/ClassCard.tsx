import Link from "next/link";
import { Calendar, Clock, Users, BadgeCheck, Layers, EyeOff, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClassStatusBadge, ClassLifecycleStatus } from "./classStatus";

interface SessionLike {
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export default function ClassCard({
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
  onClick,
  href,
}: {
  subject: string;
  /** Optional target grade (e.g. "GRADE_9"); shown as a badge when set. */
  gradeLevel?: string | null;
  topics: string[];
  /** Topics (from `topics`) the tutor has been verified for, shown with a badge. */
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
  /** Click handler (client callers). Ignored when `href` is set. */
  onClick?: () => void;
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
    ? new Date(nextSession.scheduledAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isModerated = status === "SUSPENDED" || status === "BANNED";

  const cardClassName = `card border cursor-pointer transition duration-200 text-xs p-4 space-y-3 block ${
    isModerated
      ? "bg-error/5 hover:bg-error/10 border-error/30"
      : published
      ? "bg-base-200/30 hover:bg-base-200/50 border-base-300"
      : "bg-warning/5 hover:bg-warning/10 border-warning/30"
  }`;

  const MAX_TOPICS = 3;
  const shownTopics = topics.slice(0, MAX_TOPICS);
  const overflowCount = topics.length - shownTopics.length;

  const inner = (
    <>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-base-content leading-tight truncate">{subject}</h3>
          {gradeLevel && (
            <p className="text-2xs font-semibold uppercase tracking-wide text-base-content/50 mt-0.5">
              {gradeLevel.replace("_", " ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!published && (
            <span className="badge badge-warning badge-outline text-2xs font-semibold uppercase tracking-wide gap-1 py-2">
              <EyeOff className="h-3 w-3" />
              Unpublished
            </span>
          )}
          <StatusBadge tone={tone} label={label} size="xs" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {shownTopics.map((topic) => (
            <span
              key={topic}
              className="badge badge-outline badge-sm text-2xs font-semibold gap-1 py-2.5"
            >
              {verifiedTopics?.includes(topic) && <BadgeCheck className="h-3 w-3 text-success" />}
              {topic}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="badge badge-ghost badge-sm text-2xs font-semibold py-2.5">
              +{overflowCount} more
            </span>
          )}
        </div>
        {description && <p className="text-base-content/60 line-clamp-2 leading-relaxed">{description}</p>}
      </div>

      <div className="divider my-0 opacity-40"></div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base-content/70">
        {nextSession ? (
          <>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{nextSession.duration} mins</span>
            </div>
          </>
        ) : (
          <span className="italic text-base-content/40">No upcoming sessions</span>
        )}
        <div className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>
            {enrolledCount} / {maxStudents} Enrolled
          </span>
        </div>
      </div>

      {isModerated && suspendedReason && (
        <p className="flex items-start gap-1 text-2xs text-error/90 leading-relaxed">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{suspendedReason}</span>
        </p>
      )}
    </>
  );

  return href ? (
    <Link href={href} className={cardClassName}>
      {inner}
    </Link>
  ) : (
    <div onClick={onClick} className={cardClassName}>
      {inner}
    </div>
  );
}
