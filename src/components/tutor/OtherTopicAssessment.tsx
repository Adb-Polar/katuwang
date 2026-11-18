"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import ValidatedForm from "@/components/ui/ValidatedForm";
import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { GRADE_LEVELS } from "@/lib/gradeLevels";

/**
 * Lets a tutor take a topic's certification assessment even when they don't
 * teach a class for it yet. The backend (`POST /api/tutor/assessments`) only
 * needs `{ subject, topic }` — it never checked for an owned class — so this is
 * purely a second entry point alongside `TopicCertificationList`.
 */
export default function OtherTopicAssessment() {
  const router = useRouter();
  const [grade, setGrade] = useState("");
  const { subjects, topicsFor, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog(grade || undefined);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async (validationForm: HTMLFormElement) => {
    if (!subject || !topic) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) {
        if (data.code === "BANK_NOT_READY") {
          setError(data.error || "This topic needs question approval before an assessment can start. Ask an admin to approve the bank or record qualified topic review.");
          return;
        }
        throw new Error(data.error || "Failed to start assessment.");
      }
      router.push(`/tutor/assessments/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start assessment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ValidatedForm onSubmit={(e) => { e.preventDefault(); void start(e.currentTarget); }} className="kt-card kt-card-body gap-4" aria-labelledby="other-topic">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <div>
        <h2 id="other-topic" className="font-serif text-2xl font-medium leading-tight">Any other topic</h2>
        <p className="text-sm text-(--kt-muted)">
          You don&apos;t need a class for it. Pass now and you&apos;re verified when you start teaching it.
        </p>
      </div>
      <FeedbackBanner variant="error" message={error || null} />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField size="md" label="Grade level">
          <select aria-label="Assessment topic grade" value={grade}
            onChange={(e) => { setGrade(e.target.value); setSubject(""); setTopic(""); }}
            className="select select-bordered w-full">
            <option value="">All grades</option>
            {GRADE_LEVELS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
          </select>
        </FormField>
        <FormField size="md" label="Subject" required>
          <select
            required
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
            }}
            className="select select-bordered w-full"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField size="md" label="Topic" required>
          <select
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!subject}
            className="select select-bordered w-full"
          >
            <option value="">{subject ? "Select topic" : "Pick a subject first"}</option>
            {subject &&
              topicsFor(subject).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </FormField>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? <span className="loading loading-spinner loading-sm" /> : "Start assessment"}
        </button>
      </div>
    </ValidatedForm>
  );
}
