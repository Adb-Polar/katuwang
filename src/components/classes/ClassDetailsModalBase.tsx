import type { ReactNode } from "react";
import { Calendar, Clock, Link as LinkIcon, BadgeCheck } from "lucide-react";

export default function ClassDetailsModalBase({
  subject,
  topics,
  verifiedTopics,
  scheduledAt,
  duration,
  meetingLink,
  description,
  gridExtra,
  belowDescription,
  actions,
  onClose,
}: {
  subject: string;
  topics: string[];
  /** Topics (from `topics`) the tutor has been verified for, shown with a badge. */
  verifiedTopics?: string[];
  scheduledAt: string;
  duration: number;
  meetingLink: string | null;
  description: string | null;
  /** Extra cells rendered inside the date/duration info grid (e.g. a tutor-ID cell). */
  gridExtra?: ReactNode;
  /** Full-width content rendered after the description block (e.g. an enrolled-learners table). */
  belowDescription?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl text-xs space-y-4">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
          ✕
        </button>

        {/* Header */}
        <div className="space-y-2">
          <span className="badge badge-neutral tracking-wider text-2xs uppercase font-bold px-2.5 py-2.5">
            {subject}
          </span>
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

        {/* General Info */}
        <div className="grid grid-cols-2 gap-3 bg-base-200/30 border border-base-200 rounded-xl p-3.5 text-base-content/80">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold text-2xs text-base-content/50">DATE & TIME</div>
              <div className="font-medium">
                {new Date(scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold text-2xs text-base-content/50">DURATION</div>
              <div className="font-medium">{duration} minutes</div>
            </div>
          </div>
          {gridExtra}
          <div className="col-span-2 divider my-0.5 opacity-40"></div>
          <div className="col-span-2 flex items-center gap-1.5">
            <LinkIcon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-2xs text-base-content/50">MEETING LINK</div>
              {meetingLink ? (
                <a
                  href={meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary font-medium break-all"
                >
                  {meetingLink}
                </a>
              ) : (
                <span className="text-base-content/40 italic">No link provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="space-y-1">
            <div className="font-bold text-base-content/50 text-2xs uppercase">Class Description</div>
            <p className="text-base-content/70 leading-relaxed bg-base-200/10 p-3 border border-base-200 rounded-xl">
              {description}
            </p>
          </div>
        )}

        {belowDescription}

        {actions}
      </div>
    </div>
  );
}
