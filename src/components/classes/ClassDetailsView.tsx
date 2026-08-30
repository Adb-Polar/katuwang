import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Link as LinkIcon, Users, BadgeCheck, EyeOff, MapPin } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClassStatusBadge, ClassLifecycleStatus } from "./classStatus";

export default function ClassDetailsView({
  backHref,
  subject,
  topics,
  verifiedTopics,
  status,
  activeLabel,
  published = true,
  maxStudents,
  enrolledCount,
  building,
  room,
  meetingLink,
  description,
  extraFacts,
  sessions,
  roster,
  sidebarExtra,
  actions,
}: {
  backHref: string;
  subject: string;
  topics: string[];
  /** Topics (from `topics`) the tutor has been verified for, shown with a badge. */
  verifiedTopics?: string[];
  status: ClassLifecycleStatus;
  activeLabel: string;
  /** Tutor-only: whether the class is visible to learners. Defaults to true. */
  published?: boolean;
  maxStudents: number;
  enrolledCount: number;
  building?: string | null;
  room?: string | null;
  meetingLink: string | null;
  description: string | null;
  /** Extra cells rendered inside the schedule info grid (e.g. a tutor-ID cell for learners). */
  extraFacts?: ReactNode;
  /** The class's Sessions card content (e.g. a <SessionsList /> plus an Add Session control). */
  sessions?: ReactNode;
  /** Full-width content rendered below Sessions (e.g. the enrolled-learners roster). */
  roster?: ReactNode;
  /** Extra cards rendered in the right-hand sidebar, below the quick-facts card. */
  sidebarExtra?: ReactNode;
  /** Primary action buttons, rendered top-right next to the back link. */
  actions: ReactNode;
}) {
  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, activeLabel);
  const fillPct = Math.min(100, Math.round((enrolledCount / maxStudents) * 100));

  return (
    <div className={`space-y-6 rounded-box ${!published ? "bg-base-300 border border-base-content/10 p-4" : ""}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href={backHref} className="btn btn-ghost btn-sm text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Classes
        </Link>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-neutral tracking-wider text-2xs uppercase font-bold px-2.5 py-2.5">
            {subject}
          </span>
          {published ? (
            <StatusBadge tone={tone} label={label} size="sm" />
          ) : (
            <span className="badge badge-warning badge-outline text-2xs font-semibold uppercase tracking-wide gap-1 py-2.5">
              <EyeOff className="h-3 w-3" />
              Unpublished
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <span
              key={topic}
              className="badge badge-outline badge-primary text-2xs font-semibold gap-1 py-2.5"
            >
              {verifiedTopics?.includes(topic) && <BadgeCheck className="h-3 w-3 text-success" />}
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body gap-4">
              <h2 className="card-title text-sm font-bold">Class Info</h2>
              <div className="grid grid-cols-2 gap-4 text-xs text-base-content/80">
                {extraFacts}
                {(building || room) && (
                  <div className="col-span-2 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-2xs text-base-content/50">LOCATION</div>
                      <span className="font-medium">
                        {[building && `Bldg. ${building}`, room && `Room ${room}`].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                )}
                {meetingLink && (
                  <div className="col-span-2 flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-2xs text-base-content/50">MEETING LINK</div>
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary font-medium break-all"
                      >
                        {meetingLink}
                      </a>
                    </div>
                  </div>
                )}
                {!building && !room && !meetingLink && !extraFacts && (
                  <p className="col-span-2 text-base-content/40 italic">No location or meeting link provided.</p>
                )}
              </div>
            </div>
          </div>

          {sessions && (
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-3">{sessions}</div>
            </div>
          )}

          {description && (
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-2">
                <h2 className="card-title text-sm font-bold">Description</h2>
                <p className="text-xs text-base-content/70 leading-relaxed">{description}</p>
              </div>
            </div>
          )}

          {roster && (
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-3">{roster}</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body gap-3">
              <h2 className="card-title text-sm font-bold">At a Glance</h2>
              <div className="flex items-center gap-2 text-xs text-base-content/70">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {enrolledCount} / {maxStudents} enrolled
                </span>
              </div>
              <progress className="progress progress-primary w-full" value={fillPct} max={100}></progress>
            </div>
          </div>
          {sidebarExtra}
        </div>
      </div>
    </div>
  );
}
