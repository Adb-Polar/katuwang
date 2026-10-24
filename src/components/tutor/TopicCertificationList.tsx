"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import type { TopicAssessmentStatus } from "@/lib/assessmentStatus";

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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setBusy(null);
    }
  };

  if (taughtTopics.length === 0) {
    return (
      <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        Schedule your first class to see topics you can be assessed on.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-1">
      <FeedbackBanner variant="error" message={error || null} />
      {taughtTopics.map(({ subject, topic }) => {
        const key = keyOf(subject, topic);
        const st = topicStatuses[key];
        const cert = certByKey.get(key);
        const certStatus = st?.certificationStatus ?? cert?.status ?? null;
        const lastAttempt = st?.lastAttempt ?? null;
        const awaitingConfirmation = certStatus === "PENDING" && lastAttempt?.status === "PASSED";
        const wasRequested = requested.has(key) || st?.openRequest;

        return (
          <div
            key={key}
            className="flex flex-col gap-2 p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-base-content/80 break-words">{topic}</div>
                <div className="text-2xs text-base-content/50">
                  {subjectDisplayLabel(subject)}
                  {st && !st.bankReady && (
                    <span className="ml-2 text-base-content/40">
                      · {st.activeQuestionCount}/{st.minBankSize} questions
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                {certStatus === "CERTIFIED" ? (
                  <StatusBadge tone="success" label="Verified" size="xs" />
                ) : awaitingConfirmation ? (
                  <StatusBadge tone="warning" label="Passed — awaiting confirmation" size="xs" />
                ) : st?.inProgressAttemptId ? (
                  <Link
                    href={`/tutor/assessments/${st.inProgressAttemptId}`}
                    className="btn btn-primary min-h-11 text-sm font-bold cursor-pointer"
                  >
                    Resume assessment
                  </Link>
                ) : st?.bankReady ? (
                  <>
                    {lastAttempt?.status === "FAILED" && (
                      <span className="text-2xs text-error/70">Not passed — {lastAttempt.scorePercent}%</span>
                    )}
                    <button
                      onClick={() => startAssessment(subject, topic)}
                      disabled={busy === key}
                      className="btn btn-outline btn-primary min-h-11 text-sm font-bold cursor-pointer"
                    >
                      {busy === key ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : lastAttempt?.status === "FAILED" ? (
                        "Retake"
                      ) : (
                        "Take assessment"
                      )}
                    </button>
                  </>
                ) : wasRequested ? (
                  <StatusBadge tone="neutral" label="Questions requested" size="xs" />
                ) : (
                  <button
                    onClick={() => requestQuestions(subject, topic)}
                    disabled={busy === key}
                    className="btn btn-outline min-h-11 text-sm font-bold cursor-pointer"
                  >
                    {busy === key ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Request questions"
                    )}
                  </button>
                )}
              </div>
            </div>

            {certStatus === "REJECTED" && cert?.reviewNote && (
              <p className="text-2xs text-error/80 bg-error/5 border border-error/20 rounded-lg px-2 py-1.5">
                <span className="font-semibold">Reviewer feedback:</span> {cert.reviewNote}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
