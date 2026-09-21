import { BadgeCheck, CalendarCheck, GraduationCap, Sparkles } from "lucide-react";
import ClassCard from "@/components/classes/ClassCard";
import {
  SAMPLE_CLASS_CODE,
  SAMPLE_SUBJECT,
  SAMPLE_TOPIC,
  SAMPLE_TUTOR_ID,
  sampleSessions,
} from "./sampleData";

const REASONS = [
  { icon: Sparkles, text: `Covers ${SAMPLE_TOPIC}` },
  { icon: BadgeCheck, text: `Verified for ${SAMPLE_TOPIC}` },
  { icon: CalendarCheck, text: "Fits 1 of your preferred times" },
  { icon: GraduationCap, text: "Matches your grade" },
];

/** One Auto Match result, laid out exactly as `MatchFinder` renders it: class card, score badge, reason list. */
export default function MatchResultSample() {
  return (
    <div className="space-y-1.5">
      {/* ClassCard styles itself as clickable (pointer cursor, hover lift); this is a display-only preview. */}
      <div className="pointer-events-none">
        <ClassCard
          code={SAMPLE_CLASS_CODE}
          subject={SAMPLE_SUBJECT}
          gradeLevel="GRADE_8"
          topics={[SAMPLE_TOPIC, "Algebraic Expressions"]}
          verifiedTopics={[SAMPLE_TOPIC]}
          description="Step-by-step practice solving and graphing linear equations."
          sessions={sampleSessions()}
          status="SCHEDULED"
          enrolledCount={3}
          maxStudents={6}
          activeLabel="Open"
          tutorAnonymousId={SAMPLE_TUTOR_ID}
        />
      </div>
      <div className="flex items-center gap-1.5 px-1">
        <span className="badge badge-primary badge-sm text-2xs font-bold">Match 92</span>
        <span className="text-2xs text-base-content/40">ranked by fit</span>
      </div>
      <ul className="text-2xs text-base-content/60 space-y-0.5 px-1">
        {REASONS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1">
            <Icon className="h-3 w-3 text-primary shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
