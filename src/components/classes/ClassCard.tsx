import { Calendar, Clock, Users, BadgeCheck } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClassStatusBadge, ClassLifecycleStatus } from "./classStatus";

export default function ClassCard({
  subject,
  topics,
  verifiedTopics,
  description,
  scheduledAt,
  duration,
  status,
  enrolledCount,
  maxStudents,
  activeLabel,
  onClick,
}: {
  subject: string;
  topics: string[];
  /** Topics (from `topics`) the tutor has been verified for, shown with a badge. */
  verifiedTopics?: string[];
  description: string | null;
  scheduledAt: string;
  duration: number;
  status: ClassLifecycleStatus;
  enrolledCount: number;
  maxStudents: number;
  activeLabel: string;
  onClick: () => void;
}) {
  const isFull = enrolledCount >= maxStudents;
  const { tone, label } = getClassStatusBadge(status, isFull, activeLabel);
  const formattedDate = new Date(scheduledAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={onClick}
      className="card bg-base-200/30 hover:bg-base-200/50 border border-base-300 cursor-pointer transition duration-200 text-xs p-4 space-y-3"
    >
      <div className="flex justify-between items-start">
        <span className="badge badge-neutral text-2xs font-bold tracking-wide uppercase px-2 py-2">{subject}</span>
        <StatusBadge tone={tone} label={label} size="xs" />
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {topics.map((topic) => (
            <span
              key={topic}
              className="badge badge-outline badge-sm text-2xs font-semibold gap-1 py-2.5"
            >
              {verifiedTopics?.includes(topic) && <BadgeCheck className="h-3 w-3 text-success" />}
              {topic}
            </span>
          ))}
        </div>
        {description && <p className="text-base-content/60 line-clamp-2 leading-relaxed">{description}</p>}
      </div>

      <div className="divider my-0 opacity-40"></div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base-content/70">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{duration} mins</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>
            {enrolledCount} / {maxStudents} Enrolled
          </span>
        </div>
      </div>
    </div>
  );
}
