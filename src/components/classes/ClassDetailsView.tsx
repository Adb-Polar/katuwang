import type { ReactNode } from "react";
import { BadgeCheck, EyeOff } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClassStatusBadge, ClassLifecycleStatus } from "./classStatus";
import ClassModerationPanel from "./ClassModerationPanel";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { formatDateTime } from "@/lib/datetime";
import { gradeNumber } from "@/lib/gradeLevels";

/** "Grade 7 · Class C-0240" — the class code joins the kicker instead of taking its own line. */
function codeKicker(kicker: string, code?: string | null): string | undefined {
  const parts = [kicker, code && `Class ${code}`].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

export type ClassDetailsAudience = "learner" | "tutor" | "admin";

/**
 * One class, shared by the learner, tutor and admin portals: serif header (subject · grade kicker,
 * topics as the title), a single line of plain facts, then the page's actions, sessions and extras.
 */
export default function ClassDetailsView({
  audience,
  backHref,
  backLabel,
  code,
  subject,
  gradeLevel,
  topics,
  verifiedTopics,
  status,
  published = true,
  suspendedReason,
  suspendedUntil,
  moderationExtra,
  maxStudents,
  enrolledCount,
  nextSessionAt,
  building,
  room,
  meetingLink,
  description,
  tutor,
  sessions,
  roster,
  belowRoster,
  sidebarExtra,
  actions,
}: {
  audience: ClassDetailsAudience;
  backHref: string;
  backLabel: string;
  /** Human-friendly class code (e.g. "C-0007"). */
  code?: string | null;
  subject: string;
  gradeLevel?: string | null;
  topics: string[];
  /** Topics (from `topics`) the tutor holds a certification for. */
  verifiedTopics?: string[];
  status: ClassLifecycleStatus;
  /** Whether the class is visible to learners. Defaults to true. */
  published?: boolean;
  /** Admin's reason when the class is SUSPENDED/BANNED; renders a moderation panel. */
  suspendedReason?: string | null;
  /** ISO string; null = indefinite. */
  suspendedUntil?: string | null;
  /** Rendered directly below the moderation panel (e.g. the tutor's appeal card). */
  moderationExtra?: ReactNode;
  maxStudents: number;
  enrolledCount: number;
  /** ISO string of the next session, or of the most recent one when none is upcoming. */
  nextSessionAt?: string | null;
  building?: string | null;
  room?: string | null;
  meetingLink: string | null;
  description: string | null;
  /** The tutor, as shown to this audience (anonymous ID, or name where allowed). Omit on the tutor's own page. */
  tutor?: ReactNode;
  /** The Sessions section's content: a heading row plus a <SessionsList variant="calendar" />. */
  sessions?: ReactNode;
  /** Full-width content below Sessions (e.g. the enrolled-learners roster). */
  roster?: ReactNode;
  /** Full-width content below the roster; each child brings its own card. */
  belowRoster?: ReactNode;
  /** Right-hand column (admin tools). Without it the page is a single column. */
  sidebarExtra?: ReactNode;
  /** The page's own buttons, placed after the facts so they read in order. */
  actions?: ReactNode;
}) {
  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, "Open");
  const isPlainOpen = status === "SCHEDULED" && !isFull;
  const grade = gradeLevel ? gradeNumber(gradeLevel) : null;
  const kicker = `${subjectDisplayLabel(subject)}${grade ? ` · Grade ${grade}` : ""}`;
  const verified = topics.filter((t) => verifiedTopics?.includes(t));
  const where = [building && `Bldg. ${building}`, room && `Room ${room}`].filter(Boolean).join(" · ");
  // Rows saved before the http(s)-only rule may hold another scheme; never link those.
  const webMeetingLink = meetingLink && /^https?:\/\//i.test(meetingLink.trim()) ? meetingLink : null;
  const seatsLeft = Math.max(0, maxStudents - enrolledCount);
  const sessionIsPast = nextSessionAt ? new Date(nextSessionAt) <= new Date() : false;
  const showSeats = audience === "learner" && status === "SCHEDULED";
  // The tutor's Manage menu sits beside the title; learners and admins keep their buttons after the facts.
  const headerActions = audience === "tutor" ? actions : undefined;

  const main = (
    <div className="min-w-0 space-y-6">
      {sessions && (
        <section className="card kt-card">
          <div className="kt-card-body gap-1">{sessions}</div>
        </section>
      )}

      {description && (
        <section className="card kt-card">
          <div className="kt-card-body gap-2">
            <h2 className="font-serif text-xl font-medium">About this class</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        </section>
      )}

      {roster && (
        <section className="card kt-card">
          <div className="kt-card-body gap-3">{roster}</div>
        </section>
      )}

      {belowRoster}
    </div>
  );

  return (
    <div className="space-y-6">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <div className="space-y-3">
        {topics.length === 1 ? (
          <PageHeader eyebrow={codeKicker(kicker, code)} title={topics[0]} actions={headerActions} />
        ) : (
          <>
            <PageHeader
              eyebrow={codeKicker(grade ? `Grade ${grade}` : "", code)}
              title={subjectDisplayLabel(subject)}
              actions={headerActions}
            />
            {topics.length > 1 && (
              <ul aria-label="Topics" className="flex flex-col gap-0.5 text-(--kt-muted)">
                {topics.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </>
        )}

        {/* The facts a reader acts on, as one line: when, where, how full (and the tutor for learners). */}
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="whitespace-nowrap">
            <span className="text-(--kt-muted)">{sessionIsPast ? "Last session " : "Next session "}</span>
            <span className="font-medium">{nextSessionAt ? formatDateTime(nextSessionAt) : "none scheduled"}</span>
          </span>
          <span aria-hidden="true" className="text-(--kt-muted)">·</span>
          <span className="font-medium break-words">
            {where || (webMeetingLink ? (
              <a href={webMeetingLink} target="_blank" rel="noopener noreferrer" className="link link-primary">Online meeting link</a>
            ) : <span className="text-(--kt-muted) font-normal">Place not set</span>)}
            {where && webMeetingLink && (
              <> · <a href={webMeetingLink} target="_blank" rel="noopener noreferrer" className="link link-primary">meeting link</a></>
            )}
          </span>
          <span aria-hidden="true" className="text-(--kt-muted)">·</span>
          <span className="whitespace-nowrap font-medium">
            {showSeats
              ? (isFull ? "Full" : `${seatsLeft} of ${maxStudents} seats left`)
              : `${enrolledCount} of ${maxStudents} enrolled`}
          </span>
          {tutor && (
            <>
              <span aria-hidden="true" className="text-(--kt-muted)">·</span>
              <span className="inline-flex items-center gap-1">Tutor {tutor}</span>
            </>
          )}
          {published && !isPlainOpen && <StatusBadge tone={tone} label={label} size="sm" />}
        </p>

        {verified.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-success">
            <BadgeCheck aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {audience === "tutor" ? "You're" : "The tutor is"} certified in {verified.length === topics.length ? (topics.length === 1 ? "this topic" : "all these topics") : verified.join(", ")}.
            </span>
          </p>
        )}
        {!published && (
          <p className="flex items-start gap-1.5 text-sm text-warning-content">
            <EyeOff aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Unpublished — learners can&apos;t see or join this class{audience === "tutor" ? " until you publish it from Manage" : ""}.</span>
          </p>
        )}
      </div>

      {(status === "SUSPENDED" || status === "BANNED") && (
        <div className="space-y-3">
          <ClassModerationPanel
            status={status}
            suspendedReason={suspendedReason}
            suspendedUntil={suspendedUntil}
            audience={audience === "learner" ? "learner" : "tutor"}
          />
          {moderationExtra}
        </div>
      )}

      {actions && !headerActions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}

      {sidebarExtra ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="min-w-0 lg:col-span-2">{main}</div>
          <div className="min-w-0 space-y-6">{sidebarExtra}</div>
        </div>
      ) : (
        <div className="max-w-3xl">{main}</div>
      )}
    </div>
  );
}
