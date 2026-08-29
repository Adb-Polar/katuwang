"use client";

import { Plus, Trash2 } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import FormField from "@/components/ui/FormField";

export interface PreferredSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface MatchCriteriaValue {
  subject: string;
  topics: string[];
  gradeLevel: string;
  slots: PreferredSlot[];
}

export const EMPTY_CRITERIA: MatchCriteriaValue = { subject: "", topics: [], gradeLevel: "", slots: [] };

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const ALL_SUBJECTS = Object.values(SubjectArea);

export default function MatchCriteriaFields({
  value,
  onChange,
  gradeHint,
}: {
  value: MatchCriteriaValue;
  onChange: (next: MatchCriteriaValue) => void;
  gradeHint?: string;
}) {
  const set = (patch: Partial<MatchCriteriaValue>) => onChange({ ...value, ...patch });

  const toggleTopic = (topic: string) =>
    set({
      topics: value.topics.includes(topic)
        ? value.topics.filter((t) => t !== topic)
        : [...value.topics, topic],
    });

  const updateSlot = (i: number, patch: Partial<PreferredSlot>) =>
    set({ slots: value.slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-3.5">
      <FormField label="Subject" required>
        <select
          className="select select-bordered select-sm w-full text-xs"
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value, topics: [] })}
        >
          <option value="">Select subject</option>
          {ALL_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={`Topics${value.topics.length > 0 ? ` (${value.topics.length} selected)` : ""}`}
        required
      >
        {!value.subject ? (
          <div className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-3 text-center">
            Select a subject to see its topics.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto border border-base-200 rounded-lg p-2">
            {SUBJECT_TOPICS[value.subject as SubjectArea].map((topic) => (
              <label
                key={topic}
                className="flex items-center gap-1.5 text-2xs cursor-pointer p-1 rounded hover:bg-base-200/50"
              >
                <input
                  type="checkbox"
                  checked={value.topics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="checkbox checkbox-xs checkbox-primary"
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>
        )}
      </FormField>

      <FormField label="Grade level" hint={gradeHint}>
        <select
          className="select select-bordered select-sm w-full text-xs"
          value={value.gradeLevel}
          onChange={(e) => set({ gradeLevel: e.target.value })}
        >
          <option value="">Any grade</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Preferred times" hint="Optional — helps rank classes that fit your week.">
        <div className="space-y-2">
          {value.slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-1.5 border border-base-200 rounded-lg p-2">
              <select
                value={slot.day}
                onChange={(e) => updateSlot(i, { day: e.target.value })}
                className="select select-bordered select-xs text-2xs flex-1 min-w-0"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d[0] + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                className="input input-bordered input-xs text-2xs"
              />
              <span className="text-2xs text-base-content/50">to</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                className="input input-bordered input-xs text-2xs"
              />
              <button
                type="button"
                onClick={() => set({ slots: value.slots.filter((_, idx) => idx !== i) })}
                className="btn btn-ghost btn-xs text-error shrink-0"
                aria-label="Remove time slot"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set({ slots: [...value.slots, { day: "MONDAY", startTime: "15:00", endTime: "17:00" }] })
            }
            className="btn btn-ghost btn-xs text-2xs font-bold gap-1"
          >
            <Plus className="h-3 w-3" /> Add time slot
          </button>
        </div>
      </FormField>
    </div>
  );
}

/** Shapes the shared form value into the JSON body the match / request APIs expect. */
export function criteriaToBody(value: MatchCriteriaValue) {
  return {
    subject: value.subject,
    topics: value.topics,
    ...(value.gradeLevel ? { gradeLevel: value.gradeLevel } : {}),
    ...(value.slots.length > 0 ? { preferredSlots: value.slots } : {}),
  };
}
