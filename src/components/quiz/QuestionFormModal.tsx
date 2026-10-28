"use client";

import { FormValidationError, reportServerFieldErrors } from "@/lib/formValidation";
import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export interface QuestionDraft {
  prompt: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
}

interface DraftOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Single-answer MCQ authoring modal, shared by the admin question bank and the
 * tutor class-test builder. It owns the form state and validation UI; the caller
 * supplies `onSubmit`, which should POST/PATCH and throw on failure.
 */
export default function QuestionFormModal({
  title,
  contextLabel,
  initial = null,
  submitLabel,
  topicField,
  onSubmit,
  onClose,
}: {
  title: string;
  contextLabel?: string;
  initial?: (QuestionDraft & { topic?: string }) | null;
  submitLabel: string;
  /** Optional topic picker (tutor authoring); omitted for the admin bank. */
  topicField?: { options: string[]; value: string; onChange: (t: string) => void };
  onSubmit: (draft: QuestionDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [options, setOptions] = useState<DraftOption[]>(
    initial?.options?.length
      ? initial.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setCorrect = (idx: number) =>
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  const setText = (idx: number, text: string) =>
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  const addOption = () =>
    setOptions((prev) => (prev.length >= OPTION_COUNT_MAX ? prev : [...prev, { text: "", isCorrect: false }]));
  const removeOption = (idx: number) =>
    setOptions((prev) => {
      if (prev.length <= OPTION_COUNT_MIN) return prev;
      const next = prev.filter((_, i) => i !== idx);
      if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
      return next;
    });

  const submit = async (validationForm: HTMLFormElement) => {
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        prompt,
        explanation: explanation.trim() || undefined,
        options: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      });
    } catch (err) {
      if (err instanceof FormValidationError && reportServerFieldErrors(validationForm, err)) return;
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <ValidatedForm className="modal-box max-w-lg p-6 kt-card space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }}>
        <div>
          <h3 className="font-bold text-sm text-base-content">{title}</h3>
          {contextLabel && <p className="text-2xs text-base-content/50 mt-0.5">{contextLabel}</p>}
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        {topicField && (
          <FormField label="Topic" required>
            <select
              required
              value={topicField.value}
              onChange={(e) => topicField.onChange(e.target.value)}
              className="select select-bordered select-sm text-xs w-full focus:select-primary truncate"
            >
              {topicField.options.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Question prompt" required>
          <textarea
            required
            minLength={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={1000}
            className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
          />
        </FormField>

        <FormField label="Options" hint="Select the one correct answer">
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} data-control-field>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  className="radio radio-xs radio-primary"
                  checked={o.isCorrect}
                  onChange={() => setCorrect(i)}
                />
                <input
                  type="text"
                  required
                  aria-label={`Option ${i + 1}`}
                  value={o.text}
                  onChange={(e) => setText(i, e.target.value)}
                  maxLength={500}
                  placeholder={`Option ${i + 1}`}
                  className="input input-bordered input-xs text-xs flex-1 focus:input-primary"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= OPTION_COUNT_MIN}
                  className="btn btn-ghost btn-xs text-2xs"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              </div>
              <div data-control-feedback />
              </div>
            ))}
            {options.length < OPTION_COUNT_MAX && (
              <button type="button" onClick={addOption} className="btn btn-ghost btn-xs text-2xs">
                + Add option
              </button>
            )}
          </div>
        </FormField>

        <FormField label="Explanation" hint="Shown after grading (optional)">
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            maxLength={1000}
            className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
          />
        </FormField>

        <div className="modal-action pt-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving && <span className="loading loading-spinner loading-xs" />}
            {submitLabel}
          </button>
        </div>
      </ValidatedForm>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
}
