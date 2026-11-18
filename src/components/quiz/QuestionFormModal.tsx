"use client";

import { FormValidationError, reportServerFieldErrors } from "@/lib/formValidation";
import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { Plus, X } from "lucide-react";

export interface QuestionDraft {
  prompt: string;
  explanation?: string;
  reason?: string;
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
  requireReason = false,
  onSubmit,
  onClose,
}: {
  title: string;
  requireReason?: boolean;
  contextLabel?: string;
  initial?: (QuestionDraft & { topic?: string }) | null;
  submitLabel: string;
  /** Optional topic picker (tutor authoring); omitted for the admin bank. */
  topicField?: { options: string[]; value: string; onChange: (t: string) => void };
  onSubmit: (draft: QuestionDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
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
        ...(requireReason ? { reason } : {}),
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
    <Modal open onClose={onClose} title={title} size="md" bare>
      <ValidatedForm className="space-y-5" onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }}>
        <div>
          <h2 className="font-serif text-2xl font-medium leading-tight">{title}</h2>
          {contextLabel && <p className="text-sm text-(--kt-muted) mt-1">{contextLabel}</p>}
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        {topicField && (
          <FormField size="md" label="Topic" required>
            <select
              required
              value={topicField.value}
              onChange={(e) => topicField.onChange(e.target.value)}
              className="select select-bordered w-full"
            >
              {topicField.options.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField size="md" label="Question" required>
          <textarea
            required
            minLength={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={1000}
            className="textarea textarea-bordered w-full"
          />
        </FormField>

        <FormField size="md" label="Answer choices" hint="Pick the correct answer with the circle beside it.">
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} data-control-field>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct-option"
                    aria-label={`Mark option ${i + 1} as correct`}
                    className="radio radio-primary"
                    checked={o.isCorrect}
                    onChange={() => setCorrect(i)}
                  />
                  <input
                    type="text"
                    required
                    aria-label={`Option ${i + 1} text`}
                    value={o.text}
                    onChange={(e) => setText(i, e.target.value)}
                    maxLength={500}
                    placeholder={`Choice ${i + 1}`}
                    className={`input input-bordered flex-1 min-w-0 ${o.isCorrect ? "border-primary" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= OPTION_COUNT_MIN}
                    className="btn btn-ghost btn-square"
                    aria-label={`Remove option ${i + 1}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {o.isCorrect && <p className="text-sm text-primary font-medium ml-9 mt-1">Correct answer</p>}
                <div data-control-feedback />
              </div>
            ))}
            {options.length < OPTION_COUNT_MAX && (
              <button type="button" onClick={addOption} className="btn btn-ghost gap-2 -ml-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add a choice
              </button>
            )}
          </div>
        </FormField>

        <FormField size="md" label="Explanation" hint="Optional. Learners see it after their answer is graded.">
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            maxLength={1000}
            className="textarea textarea-bordered w-full"
          />
        </FormField>

        {requireReason && (
          <FormField size="md" label="Correction reason" required hint="Explain why a new version is needed. Existing tests keep the original content.">
            <textarea
              aria-label="Correction reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={10}
              maxLength={1000}
              className="textarea textarea-bordered w-full"
            />
          </FormField>
        )}

        <div className="modal-action mt-0 pt-4 border-t border-(--kt-border)">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="loading loading-spinner loading-sm" />}
            {submitLabel}
          </button>
        </div>
      </ValidatedForm>
    </Modal>
  );
}
