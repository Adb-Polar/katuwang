"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import type { ReportViolationType } from "@prisma/client";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import { REPORT_VIOLATIONS } from "@/lib/reportViolations";

const DETAILS_MAX = 1000;

export default function ReportButton({
  targetType,
  targetId,
  targetLabel,
}: {
  targetType: "TUTOR" | "CLASS";
  targetId: string;
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
  const canSubmit =
    checked.size > 0 && (!isOther || details.trim().length >= 10) && !submitting;

  const noun = targetType === "TUTOR" ? "tutor" : "class";

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
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/learner/reports", {
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
      <span className="text-2xs text-success italic inline-flex items-center gap-1">
        <Flag className="h-3.5 w-3.5" />
        Report sent to the admins.
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm text-xs gap-1.5 text-error hover:bg-error/10"
      >
        <Flag className="h-3.5 w-3.5" />
        Report this {noun}
      </button>

      {open && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
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
            <h3 className="font-serif text-base font-semibold mb-1">
              Report {noun} {targetLabel}
            </h3>
            <p className="text-xs text-base-content/60 mb-4">
              Only administrators see this report. Your identity is not shared with the {noun}.
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <form onSubmit={submit} className="space-y-4 mt-3">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-base-content/80 pb-1">
                  What went wrong? <span className="text-error">*</span>
                </legend>
                {options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-start gap-2 text-xs text-base-content/80 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-error mt-0.5"
                      checked={checked.has(opt.value)}
                      onChange={() => toggle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>

              {isOther && (
                <FormField label="Describe the issue" required>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={DETAILS_MAX}
                    rows={3}
                    placeholder="Tell the admins what happened."
                    className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
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
                  className="btn btn-neutral btn-outline btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-error btn-sm text-xs"
                >
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : "Submit report"}
                </button>
              </div>
            </form>
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
