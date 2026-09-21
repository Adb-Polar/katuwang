import { Sparkles } from "lucide-react";
import FormField from "@/components/ui/FormField";
import { SAMPLE_GRADES, SAMPLE_SUBJECTS, SAMPLE_TOPIC, SAMPLE_TOPIC_CHOICES } from "./sampleData";

const SELECT_CLASS = "select select-bordered select-md w-full text-sm";
const SLOT_CONTROL_CLASS = "input input-bordered input-sm text-xs flex-1 min-w-24";

/**
 * A trimmed, static copy of the Auto Match form (`/learner/match`) — same markup and classes as
 * `MatchCriteriaFields`, with only the fields that tell the story and hard-coded sample values,
 * so it makes no requests. `inert` keeps it a preview: no tab stops, no edits.
 */
export default function SampleMatchForm() {
  return (
    <div className="card kt-card">
      <div className="card-body gap-4 p-5">
        <h3 className="text-sm font-bold">What do you need help with?</h3>

        <div inert className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Subject" required>
              <select className={SELECT_CLASS} defaultValue="MATH">
                {SAMPLE_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Grade level">
              <select className={SELECT_CLASS} defaultValue="GRADE_8">
                {SAMPLE_GRADES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Topics (1 selected)" required>
            <div className="grid grid-cols-2 gap-1.5 border border-base-200 rounded-lg p-2.5">
              {SAMPLE_TOPIC_CHOICES.map((topic) => (
                <label key={topic} className="flex items-center gap-1.5 text-xs p-1.5 rounded">
                  <input
                    type="checkbox"
                    defaultChecked={topic === SAMPLE_TOPIC}
                    className="checkbox checkbox-xs checkbox-primary"
                  />
                  <span>{topic}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Preferred times">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select className="select select-bordered select-sm text-xs w-full sm:flex-1 sm:min-w-28" defaultValue="TUESDAY">
                <option value="TUESDAY">Tuesday</option>
              </select>
              <div className="flex items-center gap-2 sm:flex-[2]">
                <input type="time" defaultValue="16:00" className={SLOT_CONTROL_CLASS} />
                <span className="text-xs text-base-content/50 shrink-0">to</span>
                <input type="time" defaultValue="18:00" className={SLOT_CONTROL_CLASS} />
              </div>
            </div>
          </FormField>

          <span className="btn btn-primary btn-md text-sm gap-2 w-full" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
            Auto Match
          </span>
        </div>
      </div>
    </div>
  );
}
