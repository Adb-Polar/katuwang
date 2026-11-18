"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { GRADE_LEVELS, getEligibleTargetGrades, isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import CatalogCurriculumHint from "@/components/ui/CatalogCurriculumHint";
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
  const actionBtnCls = page ? "" : "btn-sm";
  const checkboxCls = page ? "checkbox-sm" : "checkbox-xs";
  const topicLabelCls = page ? "text-sm" : "text-xs";
  const fieldSize = page ? "md" : "sm";
  const [form, setForm] = useState<ClassScheduleFormValues>({
    subject: initial?.subject ?? "",
    gradeLevel: initial?.gradeLevel ?? "",
    description: initial?.description ?? "",
    maxStudents: initial?.maxStudents ?? 1,
    building: initial?.building ?? "",
    room: initial?.room ?? "",
    meetingLink: initial?.meetingLink ?? "",
  });
  const { subjects, topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(form.gradeLevel || undefined);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initial?.topics ?? []);
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
    if (name === "subject" && subjectLocked) return;
    setForm((prev) => ({ ...prev, [name]: value, ...(name === "gradeLevel" && !subjectLocked ? { subject: "" } : {}) }));
    if (name === "subject" || name === "gradeLevel") {
      setSelectedTopics([]);
      setTopicFilter("");
      setSessionRows(prev => prev.map(row => ({ ...row, topic: "" })));
      setFormError("");
    }
  };

  const disabledTopicSet = new Set(disabledTopics);
  const allowedTopicSet = allowedTopics ? new Set(allowedTopics.map((t) => t.toLowerCase())) : null;
  const isTopicDisabled = (topic: string) =>

          disabledTopicSet.has(topic) || (allowedTopicSet ? !allowedTopicSet.has(topic.toLowerCase()) : false);

  const toggleTopic = (topic: string) => {
    if (isTopicDisabled(topic)) return;
    if (selectedTopics.some(t => t.toLowerCase() === topic.toLowerCase())) {
      setSessionRows(prev => prev.map(row => row.topic.toLowerCase() === topic.toLowerCase() ? { ...row, topic: "" } : row));
    }
    setSelectedTopics((prev) => {
      const hit = prev.find((t) => t.toLowerCase() === topic.toLowerCase());
      return hit ? prev.filter((t) => t !== hit) : [...prev, topic];
    });
  };

  const customTopics = form.subject
    ? selectedTopics.filter((t) => !topicsFor(form.subject).some((k) => k.toLowerCase() === t.toLowerCase()))
    : selectedTopics;

  const availableSubjects = form.gradeLevel ? subjects.filter(subject => topicsFor(subject.slug).length > 0) : [];
  const subjectTopics = form.gradeLevel && form.subject ? topicsFor(form.subject) : [];
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
    if (!form.gradeLevel) return reportFieldError(e.currentTarget, "Grade level", "Please select a grade.");
    if (catalogLoading || catalogLoadError) return setFormError("Load the subject catalog before scheduling a class.");
    if (!form.subject) return reportFieldError(e.currentTarget, "Subject", "Please select a subject.");
    if (!availableSubjects.some(subject => subject.slug === form.subject)) return reportFieldError(e.currentTarget, "Subject", "Select a subject available for this grade.");
    if (selectedTopics.length === 0) return reportFieldError(e.currentTarget, "Topics", "Please select at least one topic.");
    if (selectedTopics.some(topic => !subjectTopics.includes(topic) || isTopicDisabled(topic))) return reportFieldError(e.currentTarget, "Topics", "Select topics available for this grade and subject.");
    if (sessionRows.length === 0) return reportFieldError(e.currentTarget, "Sessions", "Please add at least one session.");
    const invalidSession = sessionRows.findIndex((r) => {
      const d = r.date || parseLocalDateAndTime(r.scheduledAt).date;
      const t = r.time || parseLocalDateAndTime(r.scheduledAt).time;
      return !selectedTopics.includes(r.topic) || !d || !t;
    });
    if (invalidSession !== -1) {
      reportServerFieldErrors(e.currentTarget, { fieldErrors: [{
        path: ["sessions", invalidSession, "topic"],
        message: "Choose one of the class's selected topics.",
      }] });
      return;
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
    <ValidatedForm onSubmit={handleSubmit} className={page ? "space-y-8" : "space-y-3.5"}>
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />
      <FeedbackBanner variant="error" message={formError || error || null} />
      <CatalogCurriculumHint subject={subjects.find((entry) => entry.slug === form.subject)} />
      <p className="text-sm text-(--kt-muted)">Dates and times are in {SCHOOL_TIME_ZONE_LABEL}.</p>

      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-medium">Class details</h2>
          <p className="text-sm text-(--kt-muted)">Select a grade, then choose its subject and topics.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField size={fieldSize} label="Grade level" required hint="The level of the material. Learners from any grade can enroll.">
            <select
              name="gradeLevel"
              value={form.gradeLevel}
              onChange={handleInputChange}
              required
              className={`select select-bordered ${selectCls} w-full focus:select-primary`}
            >
              <option value="">Select grade</option>
              {availableGrades.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </FormField>
          <FormField size={fieldSize} label="Subject" required>
            <select
              name="subject"
              value={form.subject}
              onChange={handleInputChange}
              required
              disabled={subjectLocked || !form.gradeLevel || catalogLoading || Boolean(catalogLoadError)}
              className={`select select-bordered ${selectCls} w-full focus:select-primary disabled:opacity-70`}
            >
              <option value="">{form.gradeLevel ? "Select subject" : "Select a grade first"}</option>
              {availableSubjects.map((sub) => (
                <option key={sub.slug} value={sub.slug}>
                  {sub.name}
                </option>
              ))}
            </select>
          </FormField>

        </div>
      </div>

      <FormField size={fieldSize} label={`Topics${selectedTopics.length > 0 ? ` (${selectedTopics.length} selected)` : ""}`} required>
        {!form.gradeLevel || !form.subject ? (
          <p className="text-sm text-(--kt-muted)">
            {form.gradeLevel ? "Pick a subject to see its topics." : "Pick a grade and subject to see their topics."}
          </p>
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
              } overflow-y-auto border border-(--kt-border) rounded-field p-2`}
            >
              {shownTopicOptions.length === 0 && (
                <p className="col-span-full text-sm text-(--kt-muted) py-2">
                  {subjectTopics.length === 0 ? "No topics are available for this subject and grade." : `No topics match “${topicFilter}”.`}
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
                    <span data-control-feedback className="block" />
                  </label>
                );
              })}
            </div>

            {customTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customTopics.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-(--kt-border) px-3 py-1 text-sm">
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
              <p className="text-sm text-(--kt-muted)">
                You can only pick topics you&apos;re certified in; your school requires it.
              </p>
            )}


          </div>
        )}
      </FormField>

      <FormField size={fieldSize} label="Description" hint="Optional. What the class will cover.">
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
          <p className="text-sm text-(--kt-muted)">Pick a subject and at least one topic first.</p>
        ) : (
          <div className="space-y-4">
            {sessionRows.map((row, i) => (
              <fieldset
                key={row.key}
                data-session-row
                className="min-w-0 rounded-(--kt-radius-box) border border-(--kt-border) p-4 sm:p-5"
              >
                <legend className="px-2 font-serif text-lg font-medium">Session {i + 1}</legend>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-(--kt-muted)">Its topic, date, start time and length.</p>
                  <button
                    type="button"
                    data-validation-change
                    onClick={() => removeSessionRow(row.key)}
                    className={`btn btn-ghost ${rowBtnCls} text-error shrink-0 cursor-pointer`}
                    aria-label={`Remove session ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
                <div className={page ? "grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_9rem_8rem]" : "grid gap-3"}>
                  <label data-control-field className="min-w-0 space-y-1.5">
                    <span className="block text-[0.9rem] font-medium">Topic</span>
                    <select
                      data-session-control="topic"
                      value={row.topic}
                      onChange={(e) => updateSessionRow(row.key, "topic", e.target.value)}
                      required
                      className={`select select-bordered ${rowSelectCls} w-full`}
                    >
                      <option value="" disabled>Select topic</option>
                      {selectedTopics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span data-control-feedback className="block" />
                  </label>
                  <div data-validation-group className="contents">
                  <label data-control-field className="min-w-0 space-y-1.5">
                    <span className="block text-[0.9rem] font-medium">Date</span>
                    <input
                      data-session-control="scheduledAt"
                      type="date"
                      value={row.date ?? parseLocalDateAndTime(row.scheduledAt).date}
                      onChange={(e) => updateSessionRow(row.key, "date", e.target.value)}
                      required
                      className={`input input-bordered ${rowInputCls} w-full min-w-0`}
                    />
                    <span data-control-feedback className="block" />
                  </label>
                  <label data-control-field className="min-w-0 space-y-1.5">
                    <span className="block text-[0.9rem] font-medium">Start time</span>
                    <input type="time" required value={row.time ?? parseLocalDateAndTime(row.scheduledAt).time}
                      onChange={(e) => updateSessionRow(row.key, "time", e.target.value)}
                      className={`input input-bordered ${rowInputCls} w-full min-w-0`} />
                    <span data-control-feedback className="block" />
                  </label>
                  </div>
                  <label data-control-field className="min-w-0 space-y-1.5">
                    <span className="block text-[0.9rem] font-medium">Duration</span>
                    <select
                      data-session-control="duration"
                      value={row.duration}
                      onChange={(e) => updateSessionRow(row.key, "duration", Number(e.target.value))}
                      className={`select select-bordered ${rowSelectCls} w-full`}
                    >
                      <option value={30}>30m</option>
                      <option value={45}>45m</option>
                      <option value={60}>1hr</option>
                      <option value={90}>1hr 30m</option>
                      <option value={120}>2hr</option>
                    </select>
                    <span data-control-feedback className="block" />
                  </label>
                </div>
              </fieldset>
            ))}
            {sessionRows.length === 0 && (
              <p className="text-sm text-(--kt-muted)">No sessions yet. Add one to set its date and time.</p>
            )}
            <button
              type="button"
              data-validation-change
              onClick={addSessionRow}
              disabled={sessionRows.length >= 20}
              className={`btn btn-outline btn-primary ${rowBtnCls} gap-1.5`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Session
            </button>
          </div>
        )}
      </FormField>

      <div className="space-y-4 border-t border-(--kt-border) pt-6">
        <div>
          <h2 className="font-serif text-xl font-medium">Where and how many</h2>
          <p className="text-sm text-(--kt-muted)">A room, an online meeting link, or both, and how many learners can join.</p>
        </div>
        <FormField size={fieldSize} label="Location" hint="Building and room for an in-person class.">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField size={fieldSize} label="Class size" required hint="Up to 10 learners.">
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

          <FormField size={fieldSize} label="Meeting link" hint="Needed if there's no building or room.">
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

      </div>

      <div className={`${page ? "flex flex-wrap justify-end gap-3 border-t border-(--kt-border) pt-6" : "modal-action pt-2"}`}>
        <button
          type="button"
          onClick={onCancel}
          className={`btn btn-ghost ${actionBtnCls}`}
        >
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={`btn btn-primary ${actionBtnCls}`}>
          {submitting ? <span className="loading loading-spinner loading-sm"></span> : submitLabel}
        </button>
      </div>
    </ValidatedForm>
  );
}
