"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import type { ReportViolationType } from "@prisma/client";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { REPORT_VIOLATIONS, type ReportTarget } from "@/lib/reportViolations";

const DETAILS_MAX = 1000;

export default function ReportButton({
  targetType,
  targetId,
  targetLabel,
  endpoint = "/api/learner/reports",
}: {
  targetType: ReportTarget;
  targetId: string;
  /** Where the report is filed: learners use the default, tutors "/api/tutor/reports". */
  endpoint?: string;
  /** Anonymised label shown in the modal heading, e.g. "TUT-0007" or "MATH · C-0231". */
  targetLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<ReportViolationType>>(new Set());
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const options = REPORT_VIOLATIONS[targetType];
  const isOther = checked.has("OTHER");

  const noun = { TUTOR: "tutor", CLASS: "class", LEARNER: "learner" }[targetType];

  const reset = () => {
    setChecked(new Set());
    setDetails("");
    setError("");
  };

  const toggle = (value: ReportViolationType) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");
    if (!checked.size) return reportFieldError(e.currentTarget, "Violations", "Select at least one issue to report.");
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          violations: Array.from(checked),
          details: details.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Could not submit your report.");
      setOpen(false);
      reset();
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <span className="text-sm text-success inline-flex items-center gap-1">
        <Flag className="h-4 w-4" aria-hidden="true" />
        Report sent to the admins.
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost gap-1.5 text-error hover:bg-error/10"
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        Report this {noun}
      </button>

      {open && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-6 kt-card relative">
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="font-serif text-xl font-medium leading-tight mb-1 pr-10">
              Report {noun} {targetLabel}
            </h3>
            <p className="text-sm text-(--kt-muted) mb-4">
              Only administrators see this report. Your identity is not shared with the {noun}.
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <ValidatedForm onSubmit={submit} className="space-y-4 mt-3">
              <fieldset data-form-field="Violations" className="space-y-1.5">
                <legend className="text-[0.9rem] font-medium text-base-content pb-1">
                  What went wrong? <span className="text-error">*</span>
                </legend>
                {options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-error mt-px"
                      checked={checked.has(opt.value)}
                      onChange={() => toggle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>

              {isOther && (
                <FormField size="md" label="Describe the issue" required>
                  <textarea
                    required
                    minLength={10}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={DETAILS_MAX}
                    rows={3}
                    placeholder="Tell the admins what happened."
                    className="textarea textarea-bordered w-full focus:textarea-primary"
                  />
                  <CharCount value={details} max={DETAILS_MAX} />
                </FormField>
              )}

              <div className="modal-action pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-error"
                >
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : "Submit report"}
                </button>
              </div>
            </ValidatedForm>
          </div>
          <label
            className="modal-backdrop"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            aria-label="Close"
          />
        </div>
      )}
    </>
  );
}
