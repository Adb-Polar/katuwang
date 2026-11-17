"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { Plus } from "lucide-react";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import FormField from "@/components/ui/FormField";

export interface PreferredSlot {
  date?: string | null;
  day: string;
  startTime: string;
  endTime: string;
}

export interface MatchCriteriaValue {
  subject: string;
  topics: string[];
  gradeLevel: string;
  slots: PreferredSlot[];
  /** Auto Match only: "" / "ANY" = any format, "SOLO" = 1-on-1, "GROUP" = group class. */
  classFormat: string;
}

export const EMPTY_CRITERIA: MatchCriteriaValue = {
  subject: "",
  topics: [],
  gradeLevel: "",
  slots: [],
  classFormat: "",
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export default function MatchCriteriaFields({
  value,
  onChange,
  gradeHint,
  gradeRequired = false,
  showFormatFilter = false,
  gradeLocked = false,
}: {
  value: MatchCriteriaValue;
  onChange: (next: MatchCriteriaValue) => void;
  gradeHint?: string;
  gradeRequired?: boolean;
  /** Auto Match passes this to show a 1-on-1 / Group selector; topic requests don't. */
  showFormatFilter?: boolean;
  gradeLocked?: boolean;
}) {
  const { subjects, topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(value.gradeLevel || undefined);
  const set = (patch: Partial<MatchCriteriaValue>) => onChange({ ...value, ...patch });

  const toggleTopic = (topic: string) =>
    set({
      topics: value.topics.includes(topic)
        ? value.topics.filter((t) => t !== topic)
        : [...value.topics, topic],
    });

  const anyDate = value.slots.some((s) => s.date != null);
  const updateSlot = (i: number, patch: Partial<PreferredSlot>) =>
    set({ slots: value.slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-5">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField size="md" label="Grade level" required={gradeRequired} hint={gradeHint}>
          <select
            className="select select-bordered w-full"
            value={value.gradeLevel}
            required={gradeRequired}
            disabled={gradeLocked}
            onChange={(e) => set({ gradeLevel: e.target.value, subject: "", topics: [] })}
          >
            <option value="">{gradeRequired ? "Select grade" : "Any grade"}</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField size="md" label="Subject" required>
          <select
            className="select select-bordered w-full"
            required
            value={value.subject}
            onChange={(e) => onChange({ ...value, subject: e.target.value, topics: [] })}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        {showFormatFilter && (
          <FormField size="md" label="Class format">
            <select
              className="select select-bordered w-full"
              value={value.classFormat}
              onChange={(e) => set({ classFormat: e.target.value })}
            >
              <option value="">Any format</option>
              <option value="SOLO">1-on-1</option>
              <option value="GROUP">Group</option>
            </select>
          </FormField>
        )}
      </div>


      <FormField
        size="md"
        label={`Topics${value.topics.length > 0 ? ` (${value.topics.length} selected)` : ""}`}
        required
      >
        {!value.subject ? (
          <p className="text-sm text-(--kt-muted)">
            Choose a subject first to see its topics.
          </p>
        ) : (
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            {topicsFor(value.subject).map((topic) => (
              <label
                key={topic}
                className="flex items-center gap-3 min-h-11 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.topics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>
        )}
      </FormField>

      <FormField size="md" label="When you're free">
        <div className="space-y-3">
          <p className="text-sm text-(--kt-muted)">Optional. Add the times you can join, in Philippine time.</p>
          {value.slots.length > 0 && (
            <ul className="border-t border-(--kt-border)">
              {value.slots.map((slot, i) => {
                // Every row shares one column layout so Day / From / To / Remove line up; once any row uses a
                // specific date, all rows get a Date column (left empty on weekly rows).
                const onDate = slot.date != null;
                return (
                  <li
                    key={i}
                    data-control-field
                    // Phone: Day (and Date) full width, From/To side by side. Wider: one row that fills the width.
                    className={`grid grid-cols-2 items-end gap-3 py-3 border-b border-(--kt-border) ${
                      anyDate ? "sm:grid-cols-[3fr_3fr_2fr_2fr_auto]" : "sm:grid-cols-[3fr_2fr_2fr_auto]"
                    }`}
                  >
                    <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">Day</span>
                      <select
                        value={onDate ? "DATE" : slot.day}
                        onChange={(e) =>
                          updateSlot(i, e.target.value === "DATE" ? { date: "" } : { day: e.target.value, date: null })
                        }
                        className="select select-bordered w-full"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            Every {d[0] + d.slice(1).toLowerCase()}
                          </option>
                        ))}
                        <option value="DATE">On a specific date</option>
                      </select>
                    </label>
                    {anyDate && !onDate && <span aria-hidden="true" className="hidden sm:block" />}
                    {onDate && (
                      <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                        <span className="text-sm text-(--kt-muted)">Date</span>
                        <input
                          type="date"
                          required
                          data-required-message="Pick a date, or choose a weekday instead."
                          value={slot.date ?? ""}
                          onChange={(e) => {
                            const date = e.target.value;
                            const day = date ? ["SUNDAY", ...DAYS.slice(0, 6)][new Date(`${date}T12:00:00Z`).getUTCDay()] : slot.day;
                            updateSlot(i, { date, day });
                          }}
                          className="input input-bordered w-full"
                        />
                      </label>
                    )}
                    <label className="min-w-0 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">From</span>
                      <input
                        type="time"
                        required
                        value={slot.startTime}
                        onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                        className="input input-bordered w-full"
                      />
                    </label>
                    <label className="min-w-0 flex flex-col gap-1">
                      <span className="text-sm text-(--kt-muted)">To</span>
                      <input
                        type="time"
                        required
                        data-after={slot.startTime}
                        value={slot.endTime}
                        onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                        className="input input-bordered w-full"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => set({ slots: value.slots.filter((_, idx) => idx !== i) })}
                      className="btn btn-ghost text-error col-span-2 sm:col-span-1 justify-self-start"
                      aria-label={`Remove time ${i + 1}`}
                    >
                      Remove
                    </button>
                    <div data-control-feedback className="col-span-full empty:hidden" />
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={() =>
              set({ slots: [...value.slots, { day: "MONDAY", startTime: "15:00", endTime: "17:00" }] })
            }
            className="btn btn-outline gap-1.5"
          >
            <Plus aria-hidden="true" className="h-4 w-4" /> {value.slots.length ? "Add another time" : "Add a time"}
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
    ...(value.slots.length > 0 ? { preferredSlots: value.slots.map((s) => ({ ...s, date: s.date || null })) } : {}),
    ...(value.classFormat && value.classFormat !== "ANY" ? { classFormat: value.classFormat } : {}),
  };
}
