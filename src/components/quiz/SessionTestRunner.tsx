"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface SessionTestRunnerOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}
export interface SessionTestRunnerItem {
  position: number;
  questionId: string;
  prompt: string;
  options: SessionTestRunnerOption[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}
export interface SessionTestRunnerAttempt {
  id: string;
  kind: "PRE" | "POST";
  title: string;
  instructions: string | null;
  status: "IN_PROGRESS" | "SUBMITTED";
  totalQuestions: number;
  correctCount?: number;
  scorePercent?: number;
  items: SessionTestRunnerItem[];
}

const KIND_LABEL: Record<string, string> = { PRE: "Pre-test", POST: "Post-test" };

export default function SessionTestRunner({
  classId,
  sessionId,
  kind,
  attemptId,
}: {
  classId: string;
  sessionId: string;
  kind: "PRE" | "POST";
  /** An existing attempt to load (in-progress or submitted); null to start a new one. */
  attemptId: string | null;
}) {
  const [attempt, setAttempt] = useState<SessionTestRunnerAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preScore, setPreScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = attemptId
          ? await fetch(`/api/learner/session-test-attempts/${attemptId}`)
          : await fetch(`/api/learner/classes/${classId}/sessions/${sessionId}/test/${kind}/start`, {
              method: "POST",
            });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load the test.");
        if (cancelled) return;
        setAttempt(data);
        setAnswers(
          Object.fromEntries(
            (data.items as SessionTestRunnerItem[])
              .filter((i) => i.selectedOptionId)
              .map((i) => [i.questionId, i.selectedOptionId!]),
          ),
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load the test.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, classId, sessionId, kind]);

  // Once a POST attempt is submitted, fetch the sibling PRE score for the delta.
  useEffect(() => {
    if (!attempt || kind !== "POST" || attempt.status !== "SUBMITTED") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/learner/classes/${classId}/session-tests`);
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const row = (data.sessions as { sessionId: string; pre: { status: string; scorePercent: number } | null }[]).find(
          (s) => s.sessionId === sessionId,
        );
        if (row?.pre?.status === "SUBMITTED") setPreScore(row.pre.scorePercent);
      } catch {
        // Non-critical: the delta simply won't show.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, kind, classId, sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }
  if (!attempt) {
    return (
      <div className="space-y-4">
        <Link href={`/learner/classes/${classId}`} className="btn btn-ghost btn-sm text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Class
        </Link>
        <FeedbackBanner variant="error" message={error || "Failed to load the test."} />
      </div>
    );
  }

  const submitted = attempt.status === "SUBMITTED";
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === attempt.items.length;
  const delta = submitted && kind === "POST" && preScore != null && attempt.scorePercent != null
    ? attempt.scorePercent - preScore
    : null;

  const doSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/learner/session-test-attempts/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit.");
      setAttempt(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/learner/classes/${classId}`}
          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Class
        </Link>
        <span className="text-2xs text-base-content/50">{KIND_LABEL[attempt.kind] ?? attempt.kind}</span>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="card-title text-sm font-bold">{attempt.title}</h2>
              <p className="text-2xs text-base-content/50 mt-0.5">{attempt.totalQuestions} questions</p>
            </div>
            {submitted ? (
              <StatusBadge tone="info" label={`${attempt.scorePercent}%`} size="sm" />
            ) : (
              <span className="text-2xs text-base-content/50">
                {answeredCount} / {attempt.items.length} answered
              </span>
            )}
          </div>

          {attempt.instructions && !submitted && (
            <p className="text-xs text-base-content/70 leading-relaxed border border-base-200 rounded-lg p-3">
              {attempt.instructions}
            </p>
          )}

          {submitted && (
            <FeedbackBanner
              variant="info"
              message={
                delta != null
                  ? `You scored ${attempt.scorePercent}% (${attempt.correctCount}/${attempt.totalQuestions}) — ${
                      delta > 0 ? `up ${delta}` : delta < 0 ? `down ${Math.abs(delta)}` : "unchanged"
                    } from your ${preScore}% pre-test. This is a diagnostic test — there is no pass or fail.`
                  : `You scored ${attempt.scorePercent}% (${attempt.correctCount}/${attempt.totalQuestions}). This is a diagnostic test — there is no pass or fail.`
              }
            />
          )}

          <FeedbackBanner variant="error" message={error || null} />

          <ol className="space-y-4">
            {attempt.items.map((item) => {
              const chosen = answers[item.questionId] ?? item.selectedOptionId;
              return (
                <li key={item.questionId} className="border border-base-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-2xs text-base-content/40 shrink-0 pt-0.5">Q{item.position + 1}</span>
                    <p className="text-sm font-semibold text-base-content/85">{item.prompt}</p>
                  </div>

                  <div className="space-y-1.5 pl-6">
                    {item.options.map((o) => {
                      const isChosen = chosen === o.id;
                      const cls = submitted
                        ? o.isCorrect
                          ? "border-success/40 bg-success/5"
                          : isChosen
                          ? "border-error/40 bg-error/5"
                          : "border-base-200"
                        : isChosen
                        ? "border-primary bg-primary/5"
                        : "border-base-200 hover:border-base-300";
                      return (
                        <label
                          key={o.id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${cls} ${
                            submitted ? "cursor-default" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name={item.questionId}
                            className="radio radio-xs radio-primary"
                            checked={isChosen}
                            disabled={submitted}
                            onChange={() => setAnswers((prev) => ({ ...prev, [item.questionId]: o.id }))}
                          />
                          <span className="text-base-content/80">{o.text}</span>
                          {submitted && o.isCorrect && <span className="text-2xs text-success ml-auto">correct</span>}
                          {submitted && isChosen && !o.isCorrect && (
                            <span className="text-2xs text-error ml-auto">your answer</span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {submitted && item.explanation && (
                    <p className="text-2xs text-base-content/55 italic pl-6">{item.explanation}</p>
                  )}
                </li>
              );
            })}
          </ol>

          {!submitted ? (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => (allAnswered ? doSubmit() : setConfirmOpen(true))}
                disabled={submitting || answeredCount === 0}
                className="btn btn-primary btn-sm text-xs cursor-pointer"
              >
                {submitting && <span className="loading loading-spinner loading-xs" />}
                Submit test
              </button>
            </div>
          ) : (
            <div className="flex justify-end pt-1">
              <Link href={`/learner/classes/${classId}`} className="btn btn-neutral btn-outline btn-sm text-xs">
                Back to class
              </Link>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Submit with unanswered questions?"
        description={`${attempt.items.length - answeredCount} question(s) are unanswered and will be marked wrong.`}
        confirmLabel="Submit anyway"
        onConfirm={doSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
