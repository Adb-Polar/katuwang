"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

/**
 * Lets a tutor take a topic's certification assessment even when they don't
 * teach a class for it yet. The backend (`POST /api/tutor/assessments`) only
 * needs `{ subject, topic }` — it never checked for an owned class — so this is
 * purely a second entry point alongside `TopicCertificationList`.
 */
export default function OtherTopicAssessment() {
  const router = useRouter();
  const { subjects, topicsFor } = useSubjectCatalog();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
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
      if (!res.ok) {
        if (data.code === "BANK_NOT_READY") {
          setError("This topic doesn't have enough questions yet — ask an admin to add some.");
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
    <div className="border border-base-200 bg-base-200/20 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-xs font-bold text-base-content/80">Take an assessment for any topic</h3>
        <p className="text-2xs text-base-content/55 mt-0.5">
          You don&apos;t need a class for it — pass now and you&apos;ll be verified when you do teach it.
        </p>
      </div>
      <FeedbackBanner variant="error" message={error || null} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Subject">
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
            }}
            className="select select-bordered select-sm w-full text-xs focus:select-primary"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Topic">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!subject}
            className="select select-bordered select-sm w-full text-xs focus:select-primary disabled:opacity-60"
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
          type="button"
          onClick={start}
          disabled={busy || !subject || !topic}
          className="btn btn-primary btn-sm text-xs"
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : "Start assessment"}
        </button>
      </div>
    </div>
  );
}
