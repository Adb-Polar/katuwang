"use client";

import { reportFieldError } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { normalizeTopic } from "@/lib/subjectTopics";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS, getEligibleTargetGrades, isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { parseLocalDateAndTime, combineDateAndTime, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";

export interface SessionRowValue {
  key: string;
  topic: string;
  date?: string;
  time?: string;
  scheduledAt?: string;
  duration: number;
}

export interface ClassScheduleFormValues {
  subject: string;
  gradeLevel: string;
  description: string;
  maxStudents: number;
  building: string;
  room: string;
  meetingLink: string;
}

export interface ClassScheduleSubmitPayload extends ClassScheduleFormValues {
  topics: string[];
  sessions: { topic: string; scheduledAt: string; duration: number }[];
}


let rowIdCounter = 0;
function newRowKey() {
  rowIdCounter += 1;
  return `row-${rowIdCounter}`;
}

/**
 * The reusable body of "create/accept-into a class": subject, target grade,
 * topics, description, sessions, location, capacity, meeting link. Used by
 * `NewClassForm` (tutor-initiated, `/tutor/classes/new`) and `AcceptRequestForm`
 * (accepting a topic request, `/tutor/requests/[id]/accept`) so there's one
 * implementation of the class form.
 */
export default function ClassScheduleFields({
  initial,
  subjectLocked = false,
  disabledTopics = [],
  allowedTopics,
  allowCustomTopics = true,
  tutorGradeLevel,
  submitLabel = "Schedule",
  submitting = false,
  error,
  variant = "modal",
  onCancel,
  onSubmit,
}: {
  initial?: Partial<ClassScheduleFormValues> & { topics?: string[]; sessionRows?: SessionRowValue[] };
  /** Subject can't be changed — used when accepting a request (subject comes from the request). */
  subjectLocked?: boolean;
  /**
   * When set, ONLY these topics may be selected (case-insensitive) — used when
   * the platform requires certification to create a class, so the picker mirrors
   * the tutor's CERTIFIED topics. Also forces the custom-topic input off.
   */
  allowedTopics?: string[];
  /** Topics in the subject's list that can't be checked (e.g. the tutor isn't CERTIFIED for them). */
  disabledTopics?: string[];
  /** When false, hides the "add another topic" custom-topic input (accept flow: only certified topics allowed). */
  allowCustomTopics?: boolean;
  /** The tutor's authenticated grade level — restricts target grade options to tutorGrade and below. */
  tutorGradeLevel?: string | null;
  submitLabel?: string;
  submitting?: boolean;
  error?: string;
  /** "modal" = compact controls for the dialog (accept-request flow); "page" = comfortable full-size controls. */
  variant?: "modal" | "page";
  onCancel: () => void;
  onSubmit: (payload: ClassScheduleSubmitPayload, form: HTMLFormElement) => void;
}) {
  const page = variant === "page";
  const inputCls = "min-h-11 text-base sm:text-sm";
  const selectCls = "min-h-11 text-base sm:text-sm";
  const rowInputCls = "min-h-11 text-base sm:text-sm";
  const rowSelectCls = "min-h-11 text-base sm:text-sm";
  const rowBtnCls = "min-h-11";
  const textareaCls = "text-base sm:text-sm h-24";
  const actionBtnCls = page ? "btn-md text-sm" : "btn-sm text-xs";
  const checkboxCls = page ? "checkbox-sm" : "checkbox-xs";
  const topicLabelCls = page ? "text-xs" : "text-2xs";
  const fieldSize = page ? "md" : "sm";
  const { subjects, topicsFor } = useSubjectCatalog();
  const [form, setForm] = useState<ClassScheduleFormValues>({
    subject: initial?.subject ?? "",
    gradeLevel: initial?.gradeLevel ?? "",
    description: initial?.description ?? "",
    maxStudents: initial?.maxStudents ?? 1,
    building: initial?.building ?? "",
    room: initial?.room ?? "",
    meetingLink: initial?.meetingLink ?? "",
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initial?.topics ?? []);
  const [customTopic, setCustomTopic] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [sessionRows, setSessionRows] = useState<SessionRowValue[]>(() => {
    return (initial?.sessionRows ?? []).map((r) => {
      const parsed = parseLocalDateAndTime(r.scheduledAt);
      return {
        ...r,
        date: r.date ?? parsed.date,
        time: r.time ?? parsed.time,
      };
    });
  });
  const [formError, setFormError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "subject" && !subjectLocked) {
      setSelectedTopics([]);
      setCustomTopic("");
    }
  };

  const disabledTopicSet = new Set(disabledTopics);
  const allowedTopicSet = allowedTopics ? new Set(allowedTopics.map((t) => t.toLowerCase())) : null;
  const customAllowed = allowCustomTopics && !allowedTopicSet;
  const isTopicDisabled = (topic: string) =>
    disabledTopicSet.has(topic) || (allowedTopicSet ? !allowedTopicSet.has(topic.toLowerCase()) : false);

  const toggleTopic = (topic: string) => {
    if (isTopicDisabled(topic)) return;
    setSelectedTopics((prev) => {
      const hit = prev.find((t) => t.toLowerCase() === topic.toLowerCase());
      return hit ? prev.filter((t) => t !== hit) : [...prev, topic];
    });
  };

  const addCustomTopic = () => {
    const raw = normalizeTopic(customTopic);
    if (raw.length < 2) return;
    // Canonicalise against the catalogue so "algebra" resolves to "Algebra"
    // rather than being added as a case-mismatched ghost entry that shows in
    // the "N selected" count but matches no checkbox and no custom chip.
    const catalogueMatch = form.subject
      ? topicsFor(form.subject).find((k) => k.toLowerCase() === raw.toLowerCase())
      : undefined;
    const t = catalogueMatch ?? raw;
    const exists = selectedTopics.some((s) => s.toLowerCase() === t.toLowerCase());
    if (!exists && selectedTopics.length < 10) setSelectedTopics((prev) => [...prev, t]);
    setCustomTopic("");
  };

  const customTopics = form.subject
    ? selectedTopics.filter((t) => !topicsFor(form.subject).some((k) => k.toLowerCase() === t.toLowerCase()))
    : selectedTopics;

  const subjectTopics = form.subject ? topicsFor(form.subject) : [];
  const q = topicFilter.trim().toLowerCase();
  const shownTopicOptions = q
    ? subjectTopics.filter((t) => t.toLowerCase().includes(q))
    : subjectTopics;

  const addSessionRow = () => {
    setSessionRows((prev) => [
      ...prev,
      {
        key: newRowKey(),
        topic: selectedTopics[0] ?? "",
        date: "",
        time: "",
        scheduledAt: "",
        duration: 60,
      },
    ]);
  };

  const removeSessionRow = (key: string) => {
    setSessionRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateSessionRow = (
    key: string,
    field: "topic" | "date" | "time" | "scheduledAt" | "duration",
    value: string | number
  ) => {
    setSessionRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const updated = { ...r, [field]: value };
        if (field === "date" || field === "time") {
          const d = field === "date" ? String(value) : r.date || "";
          const t = field === "time" ? String(value) : r.time || "";
          if (d && t) {
            updated.scheduledAt = `${d}T${t}`;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.subject) return reportFieldError(e.currentTarget, "Subject Area", "Please select a subject.");
    if (selectedTopics.length === 0) return reportFieldError(e.currentTarget, "Topic(s)", "Please select at least one topic.");
    if (sessionRows.length === 0) return reportFieldError(e.currentTarget, "Sessions", "Please add at least one session.");
    const invalidSession = sessionRows.some((r) => {
      const d = r.date || parseLocalDateAndTime(r.scheduledAt).date;
      const t = r.time || parseLocalDateAndTime(r.scheduledAt).time;
      return !r.topic || !d || !t;
    });
    if (invalidSession) {
      return reportFieldError(e.currentTarget, "Sessions", "Every session needs a topic, date, and time.");
    }
    if (!form.building.trim() && !form.room.trim() && !form.meetingLink.trim()) {
      return reportFieldError(e.currentTarget, "Location", "Please provide a location (building/room) or a meeting link.");
    }
    if (form.gradeLevel && tutorGradeLevel && !isTargetGradeEligibleForTutor(form.gradeLevel, tutorGradeLevel)) {
      return setFormError("Target grade cannot be higher than your current grade level.");
    }

    onSubmit({
      ...form,
      topics: selectedTopics,
      sessions: sessionRows.map((r) => {
        const d = r.date || parseLocalDateAndTime(r.scheduledAt).date;
        const t = r.time || parseLocalDateAndTime(r.scheduledAt).time;
        const iso = combineDateAndTime(d, t) ?? new Date().toISOString();
        return {
          topic: r.topic,
          scheduledAt: iso,
          duration: r.duration,
        };
      }),
    }, e.currentTarget as HTMLFormElement);
  };

  const availableGrades = tutorGradeLevel ? getEligibleTargetGrades(tutorGradeLevel) : GRADE_LEVELS;

  return (
    <ValidatedForm onSubmit={handleSubmit} className={page ? "space-y-5" : "space-y-3.5"}>
      <FeedbackBanner variant="error" message={formError || error || null} />
      <p className="text-xs text-base-content/60">Enter session dates and times in {SCHOOL_TIME_ZONE_LABEL}.</p>

      <FormField size={fieldSize} label="Subject Area" required>
        <select
          name="subject"
          value={form.subject}
          onChange={handleInputChange}
          required
          disabled={subjectLocked}
          className={`select select-bordered ${selectCls} w-full focus:select-primary disabled:opacity-70`}
        >
          <option value="">Select subject</option>
          {subjects.map((sub) => (
            <option key={sub.slug} value={sub.slug}>
              {sub.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField size={fieldSize} label="Target Grade" hint="Optional — helps matching. Leave as 'Any grade' if it's open to all.">
        <select
          name="gradeLevel"
          value={form.gradeLevel}
          onChange={handleInputChange}
          className={`select select-bordered ${selectCls} w-full focus:select-primary`}
        >
          <option value="">Any grade</option>
          {availableGrades.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField size={fieldSize} label={`Topic(s)${selectedTopics.length > 0 ? ` (${selectedTopics.length} selected)` : ""}`} required>
        {!form.subject ? (
          <div className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-3 text-center">
            Select a subject to see available topics.
          </div>
        ) : (
          <div className="space-y-2">
            {subjectTopics.length > 8 && (
              <input
                type="text"
                aria-label="Search available topics"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                placeholder="Search topics…"
                className={`input input-bordered ${rowInputCls} w-full focus:input-primary`}
              />
            )}
            <div
              className={`grid grid-cols-2 ${page ? "sm:grid-cols-3" : ""} gap-1.5 ${
                page ? "max-h-56" : "max-h-40"
              } overflow-y-auto border border-base-200 rounded-lg p-2`}
            >
              {shownTopicOptions.length === 0 && (
                <p className="col-span-full text-2xs text-base-content/50 italic py-2 text-center">
                  No topics match “{topicFilter}”.
                </p>
              )}
              {shownTopicOptions.map((topic) => {
                const disabled = isTopicDisabled(topic);
                return (
                  <label
                    key={topic}
                    className={`flex items-center gap-1.5 ${topicLabelCls} p-1 rounded ${
                      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-base-200/50"
                    }`}
                    title={disabled ? "You're not certified for this topic." : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.some((t) => t.toLowerCase() === topic.toLowerCase())}
                      disabled={disabled}
                      onChange={() => toggleTopic(topic)}
                      className={`checkbox ${checkboxCls} checkbox-primary`}
                    />
                    <span>{topic}</span>
                  </label>
                );
              })}
            </div>

            {customTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customTopics.map((t) => (
                  <span key={t} className="badge badge-outline badge-sm gap-1 text-2xs">
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTopic(t)}
                      className="text-error"
                      aria-label={`Remove ${t}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {allowedTopicSet && (
              <p className="text-2xs text-base-content/50">
                Your school requires certification to teach a topic — only topics you&apos;ve
                passed the assessment for can be picked.
              </p>
            )}

            {customAllowed && (
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Add a custom topic"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTopic();
                    }
                  }}
                  placeholder="Add another topic not listed above…"
                  maxLength={60}
                  className={`input input-bordered ${rowInputCls} flex-1 focus:input-primary`}
                />
                <button
                  type="button"
                  onClick={addCustomTopic}
                  disabled={normalizeTopic(customTopic).length < 2 || selectedTopics.length >= 10}
                  className={`btn btn-outline ${rowBtnCls} ${page ? "text-sm" : "text-2xs"}`}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </FormField>

      <FormField size={fieldSize} label="Description" hint="Optional">
        <textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          placeholder="Briefly explain what will be covered in this class..."
          maxLength={500}
          className={`textarea textarea-bordered ${textareaCls} w-full focus:textarea-primary`}
        />
        <CharCount value={form.description} max={500} />
      </FormField>

      <FormField
        size={fieldSize}
        label={`Sessions${sessionRows.length > 0 ? ` (${sessionRows.length})` : ""}`}
        required
        hint="Each session covers one topic from the ones selected above."
      >
        {!form.subject || selectedTopics.length === 0 ? (
          <div className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-3 text-center">
            Select a subject and at least one topic first.
          </div>
        ) : (
          <div className="space-y-2">
            {sessionRows.map((row, i) => (
              <div
                key={row.key}
                data-control-field
                className="border border-base-300 bg-base-200/40 rounded-lg p-2.5 space-y-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`${page ? "text-xs" : "text-2xs"} font-semibold text-base-content/50 shrink-0`}>
                    #{i + 1}
                  </span>
                  <select
                    aria-label={`Session #${i + 1} topic`}
                    value={row.topic}
                    onChange={(e) => updateSessionRow(row.key, "topic", e.target.value)}
                    className={`select select-bordered ${rowSelectCls} flex-1 min-w-0 truncate`}
                  >
                    {selectedTopics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSessionRow(row.key)}
                    className={`btn btn-ghost ${rowBtnCls} text-error shrink-0 cursor-pointer`}
                    aria-label="Remove session"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="date"
                    required
                    aria-label={`Session #${i + 1} date`}
                    value={row.date ?? parseLocalDateAndTime(row.scheduledAt).date}
                    onChange={(e) => updateSessionRow(row.key, "date", e.target.value)}
                    className={`input input-bordered ${rowInputCls} flex-1 min-w-[8.5rem]`}
                  />
                  <input
                    type="time"
                    required
                    aria-label={`Session #${i + 1} time`}
                    value={row.time ?? parseLocalDateAndTime(row.scheduledAt).time}
                    onChange={(e) => updateSessionRow(row.key, "time", e.target.value)}
                    className={`input input-bordered ${rowInputCls} w-28 shrink-0`}
                  />
                  <select
                    value={row.duration}
                    aria-label={`Session #${i + 1} duration`}
                    onChange={(e) => updateSessionRow(row.key, "duration", Number(e.target.value))}
                    className={`select select-bordered ${rowSelectCls} shrink-0`}
                  >
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                    <option value={90}>90m</option>
                    <option value={120}>120m</option>
                  </select>
                </div>
                <div data-control-feedback />
              </div>
            ))}
            <button
              type="button"
              data-validation-change
              onClick={addSessionRow}
              className={`btn btn-ghost ${rowBtnCls} ${page ? "text-sm" : "text-2xs"} font-bold gap-1 cursor-pointer`}
            >
              <Plus className="h-3 w-3" /> Add Session
            </button>
          </div>
        )}
      </FormField>

      <FormField size={fieldSize} label="Location" hint="A location or a meeting link is required — for an in-person class">
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="text"
            aria-label="Building"
            name="building"
            value={form.building}
            onChange={handleInputChange}
            placeholder="Building"
            className={`input input-bordered ${inputCls} flex-1 min-w-[10rem] focus:input-primary`}
          />
          <input
            type="text"
            aria-label="Room"
            name="room"
            value={form.room}
            onChange={handleInputChange}
            placeholder="Room"
            className={`input input-bordered ${inputCls} ${page ? "w-28" : "w-24"} shrink-0 focus:input-primary`}
          />
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField size={fieldSize} label="Max Capacity" required>
          <input
            type="number"
            name="maxStudents"
            value={form.maxStudents}
            onChange={handleInputChange}
            required
            min={1}
            max={10}
            className={`input input-bordered ${inputCls} w-full focus:input-primary`}
          />
        </FormField>

        <FormField size={fieldSize} label="Meeting Link" hint="Required if no location is set">
          <input
            type="url"
            name="meetingLink"
            value={form.meetingLink}
            onChange={handleInputChange}
            placeholder="https://meet.google.com/..."
            className={`input input-bordered ${inputCls} w-full focus:input-primary`}
          />
        </FormField>
      </div>

      <div className={`${page ? "flex justify-end gap-2" : "modal-action"} pt-2`}>
        <button
          type="button"
          onClick={onCancel}
          className={`btn btn-neutral btn-outline ${actionBtnCls} cursor-pointer`}
        >
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={`btn btn-primary ${actionBtnCls} cursor-pointer`}>
          {submitting ? <span className="loading loading-spinner loading-sm"></span> : submitLabel}
        </button>
      </div>
    </ValidatedForm>
  );
}
