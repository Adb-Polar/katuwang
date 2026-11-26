"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { BadgeCheck } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import type { TopicAssessmentStatus } from "@/lib/assessmentStatus";
import { useToast } from "@/components/ui/Toast";

export interface TaughtTopic {
  subject: string;
  topic: string;
}

export interface TopicCertificationEntry {
  subject: string;
  topic: string;
  status: "PENDING" | "CERTIFIED" | "REJECTED";
  reviewNote?: string | null;
}

function keyOf(subject: string, topic: string) {
  return `${subject}::${topic}`;
}

export default function TopicCertificationList({
  taughtTopics,
  initialCertifications,
  topicStatuses,
  requested,
  onRequested,
}: {
  taughtTopics: TaughtTopic[];
  initialCertifications: TopicCertificationEntry[];
  topicStatuses: Record<string, TopicAssessmentStatus>;
  /** Keys (`subject::topic`) already requested this session — owned by the parent so it survives tab switches. */
  requested: Set<string>;
  onRequested: (key: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const certByKey = new Map(initialCertifications.map((c) => [keyOf(c.subject, c.topic), c]));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startAssessment = async (subject: string, topic: string) => {
    const key = keyOf(subject, topic);
    setBusy(key);
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
          setError("This topic doesn't have enough questions yet — request that an admin add some.");
          return;
        }
        throw new Error(data.error || "Failed to start assessment.");
      }
      router.push(`/tutor/assessments/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start assessment.");
    } finally {
      setBusy(null);
    }
  };

  const requestQuestions = async (subject: string, topic: string) => {
    const key = keyOf(subject, topic);
    setBusy(key);
    setError("");
    try {
      const res = await fetch("/api/tutor/question-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request.");
      onRequested(key);
      toast("Question request sent to the admins.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setBusy(null);
    }
  };

  if (taughtTopics.length === 0) {
    return (
      <p className="kt-card px-5 py-6">
        You aren&apos;t teaching any topics right now. Pick one under &ldquo;Any other topic&rdquo; to take its assessment.
      </p>
    );
  }

  return (
    <section aria-labelledby="taught-topics" className="kt-card">
      <div className="px-5 py-4 border-b border-(--kt-border)">
        <h2 id="taught-topics" className={sectionTitle}>Topics you teach</h2>
        <p className="text-sm text-(--kt-muted)">
          Pass a topic&apos;s assessment to get a verified mark learners can see. No assessment yet? Ask an admin to add
          questions.
        </p>
      </div>
      <FeedbackBanner variant="error" message={error || null} />
      <ul>
        {taughtTopics.map(({ subject, topic }) => {
          const key = keyOf(subject, topic);
          const st = topicStatuses[key];
          const cert = certByKey.get(key);
          const certStatus = st?.certificationStatus ?? cert?.status ?? null;
          const lastAttempt = st?.lastAttempt ?? null;
          const awaitingConfirmation = certStatus === "PENDING" && lastAttempt?.status === "PASSED" && lastAttempt.certificationEligible;
          const wasRequested = requested.has(key) || st?.openRequest;

          return (
            <li key={key} className="px-5 py-4 border-b border-(--kt-border) last:border-b-0 space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium leading-snug break-words">{topic}</p>
                  <p className="text-sm text-(--kt-muted)">
                    {subjectDisplayLabel(subject)}
                    {st && !st.bankReady && ` · ${st.activeQuestionCount} of ${st.minBankSize} questions ready`}
                    {lastAttempt?.status === "FAILED" && certStatus !== "CERTIFIED" && (
                      <span className="text-error"> · last score {lastAttempt.scorePercent}%, not passed</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  {certStatus === "CERTIFIED" ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      Verified
                    </span>
                  ) : awaitingConfirmation ? (
                    <span className="text-sm font-medium">Passed, waiting for confirmation</span>
                  ) : st?.inProgressAttemptId ? (
                    <Link href={`/tutor/assessments/${st.inProgressAttemptId}`} className="btn btn-primary">
                      Resume assessment
                    </Link>
                  ) : st?.bankReady ? (
                    <button
                      onClick={() => startAssessment(subject, topic)}
                      disabled={busy === key}
                      className="btn btn-outline btn-primary"
                    >
                      {busy === key ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : lastAttempt?.status === "FAILED" ? (
                        "Retake"
                      ) : (
                        "Take assessment"
                      )}
                    </button>
                  ) : wasRequested ? (
                    <span className="text-sm text-(--kt-muted)">Questions requested</span>
                  ) : (
                    <button
                      onClick={() => requestQuestions(subject, topic)}
                      disabled={busy === key}
                      className="btn btn-outline"
                    >
                      {busy === key ? <span className="loading loading-spinner loading-sm"></span> : "Request questions"}
                    </button>
                  )}
                </div>
              </div>

              {certStatus === "REJECTED" && cert?.reviewNote && (
                <p className="text-sm text-error">Reviewer: {cert.reviewNote}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const sectionTitle = "font-serif text-2xl font-medium leading-tight";
