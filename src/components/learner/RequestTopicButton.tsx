"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import MatchCriteriaFields, {
  MatchCriteriaValue,
  EMPTY_CRITERIA,
  criteriaToBody,
} from "@/components/learner/MatchCriteriaFields";

export default function RequestTopicButton({
  tutorId,
  tutorAnonymousId,
  defaultGrade,
  verifiedTopicsHint,
}: {
  tutorId: string;
  tutorAnonymousId: string;
  defaultGrade?: string;
  /** e.g. "MATH: Algebraic Expressions, Fractions & Decimals" — shown as a hint, not enforced. */
  verifiedTopicsHint?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState<MatchCriteriaValue>({
    ...EMPTY_CRITERIA,
    gradeLevel: defaultGrade ?? "",
  });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!criteria.subject) return setError("Please choose a subject.");
    if (criteria.topics.length === 0) return setError("Please choose at least one topic.");
    if (!criteria.gradeLevel) return setError("Please choose a grade level.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/learner/topic-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteriaToBody(criteria), note, directedTutorId: tutorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your request.");
      setOpen(false);
      router.push("/learner/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm text-xs gap-1.5">
        <Send className="h-3.5 w-3.5" />
        Request a topic from this tutor
      </button>

      {open && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Request a topic from {tutorAnonymousId}</h3>
            <p className="text-xs text-base-content/60 mb-4">
              Only this tutor will see this request. They can accept it and create a class for you.
            </p>

            {verifiedTopicsHint && verifiedTopicsHint.length > 0 && (
              <p className="text-2xs text-base-content/50 mb-3 italic">
                This tutor is verified in: {verifiedTopicsHint.join(", ")}.
              </p>
            )}

            <FeedbackBanner variant="error" message={error || null} />

            <form onSubmit={submit} className="space-y-4 mt-3">
              <MatchCriteriaFields value={criteria} onChange={setCriteria} />
              <FormField label="Note" hint="Optional — anything this tutor should know.">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  className="textarea textarea-bordered textarea-sm w-full text-xs h-16"
                  placeholder="e.g. I struggle with word problems the most."
                />
                <CharCount value={note} max={500} />
              </FormField>
              <div className="modal-action pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-neutral btn-outline btn-sm text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm text-xs">
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
