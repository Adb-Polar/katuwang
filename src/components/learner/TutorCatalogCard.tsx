import Link from "next/link";
import { Check } from "lucide-react";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";

const MAX_TOPICS = 3;
const MAX_SUBJECTS = 2;

export interface TutorCatalogItem {
  id: string;
  anonymousId: string;
  /** Only present when the school shows tutor names (`showTutorRealNames`). */
  name?: string;
  section?: string;
  subjects: string[];
  verifiedTopics: { subject: string; topic: string }[];
  verifiedTopicCount: number;
  publishedClassCount: number;
  nextSessionAt: string | null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * One tutor in the Find Tutors catalog, built like `ClassCatalogCard`: the anonymous ID as the
 * title, what they're certified to teach, and a footer with counts and the next session.
 * Anonymity is kept — only the ID shows unless the school allows names.
 */
export default function TutorCatalogCard({ tutor }: { tutor: TutorCatalogItem }) {
  const next = tutor.nextSessionAt;
  const topics = tutor.verifiedTopics.slice(0, MAX_TOPICS);
  const moreTopics = tutor.verifiedTopics.length - topics.length;
  const subjects = tutor.subjects.slice(0, MAX_SUBJECTS).map(subjectDisplayLabel);
  const moreSubjects = tutor.subjects.length - subjects.length;

  return (
    <Link
      href={`/learner/tutors/${tutor.id}`}
      // flex!: the portal's phone touch-target rule turns links into one centred row.
      className="kt-card flex! flex-col! items-stretch! h-full p-5 gap-4 hover:border-primary/50 transition-colors"
    >
      <span className="flex flex-col gap-1">
        <span className="kt-id kt-id--tutor text-lg leading-snug">{tutor.name || tutor.anonymousId}</span>
        {tutor.name && (
          <span className="text-sm text-(--kt-muted)">
            {tutor.anonymousId}
            {tutor.section && ` · ${tutor.section}`}
          </span>
        )}
        {tutor.subjects.length > 0 && (
          <span className="text-sm text-(--kt-muted)">
            {subjects.join(" · ")}
            {moreSubjects > 0 && ` +${moreSubjects} more`}
          </span>
        )}
      </span>

      {topics.length > 0 && (
        <span className="flex flex-col gap-1" aria-label="Certified topics">
          <span className="text-sm text-(--kt-muted)">Certified to teach</span>
          {topics.map((cert) => (
            <span key={`${cert.subject}::${cert.topic}`} title={cert.topic} className="flex items-start gap-1.5 text-success">
              <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="font-medium leading-snug text-base-content">{cert.topic}</span>
            </span>
          ))}
          {moreTopics > 0 && <span className="text-sm text-(--kt-muted) pl-5.5">+{moreTopics} more</span>}
        </span>
      )}

      <span className="mt-auto pt-3 border-t border-(--kt-border) flex items-end justify-between gap-3 text-sm">
        <span className="min-w-0 flex flex-col text-(--kt-muted)">
          <span>{plural(tutor.verifiedTopicCount, "verified topic", "verified topics")}</span>
          {next && (
            <span className="tabular-nums">
              Next session {formatWeekday(next)}, {formatDayMonth(next)} · {formatTime(next)}
            </span>
          )}
        </span>
        <span className="shrink-0 font-medium text-primary">
          {plural(tutor.publishedClassCount, "class", "classes")}
        </span>
      </span>
    </Link>
  );
}
