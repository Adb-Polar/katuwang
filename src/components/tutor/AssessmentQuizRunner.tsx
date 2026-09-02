"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}
export interface QuizItem {
  position: number;
  questionId: string;
  prompt: string;
  options: QuizOption[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}
export interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  questionCount: number;
  passPercent: number;
  correctCount?: number;
  scorePercent?: number;
  submittedAt: string | null;
  items: QuizItem[];
}

export default function AssessmentQuizRunner({ attempt: initial }: { attempt: QuizAttempt }) {
  const [attempt, setAttempt] = useState<QuizAttempt>(initial);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initial.items.filter((i) => i.selectedOptionId).map((i) => [i.questionId, i.selectedOptionId!])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submitted = attempt.status !== "IN_PROGRESS";
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === attempt.items.length;

  const doSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/assessments/${attempt.id}/submit`, {
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

  const passed = attempt.status === "PASSED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/tutor/assessments" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Assessments
        </Link>
        <span className="text-2xs text-base-content/50">
          {attempt.subject} · attempt #{attempt.attemptNo}
        </span>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="card-title text-sm font-bold">{attempt.topic}</h2>
              <p className="text-2xs text-base-content/50 mt-0.5">
                {attempt.questionCount} questions · pass mark {attempt.passPercent}%
              </p>
            </div>
            {submitted ? (
              <StatusBadge
                tone={passed ? "success" : "error"}
                label={passed ? "Passed" : "Not passed"}
                size="sm"
              />
            ) : (
              <span className="text-2xs text-base-content/50">
                {answeredCount} / {attempt.items.length} answered
              </span>
            )}
          </div>

          {submitted && (
            <FeedbackBanner
              variant={passed ? "success" : "error"}
              message={
                passed
                  ? `You scored ${attempt.scorePercent}% (${attempt.correctCount}/${attempt.questionCount}). Your result has been recorded — check your topic status on the Assessments page.`
                  : `You scored ${attempt.scorePercent}% (${attempt.correctCount}/${attempt.questionCount}). You need ${attempt.passPercent}% to pass — you can retake this assessment.`
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
                    <span className="text-2xs text-base-content/40 shrink-0 pt-0.5">
                      Q{item.position + 1}
                    </span>
                    <p className="text-sm font-semibold text-base-content/85">{item.prompt}</p>
                  </div>

                  <div className="space-y-1.5 pl-6">
                    {item.options.map((o) => {
                      const isChosen = chosen === o.id;
                      const showState = submitted;
                      const cls = showState
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
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer ${cls} ${
                            submitted ? "cursor-default" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={item.questionId}
                            className="radio radio-xs radio-primary"
                            checked={isChosen}
                            disabled={submitted}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [item.questionId]: o.id }))
                            }
                          />
                          <span className="text-base-content/80">{o.text}</span>
                          {submitted && o.isCorrect && (
                            <span className="text-2xs text-success ml-auto">correct</span>
                          )}
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

          {!submitted && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => (allAnswered ? doSubmit() : setConfirmOpen(true))}
                disabled={submitting || answeredCount === 0}
                className="btn btn-primary btn-sm text-xs cursor-pointer"
              >
                {submitting && <span className="loading loading-spinner loading-xs" />}
                Submit assessment
              </button>
            </div>
          )}

          {submitted && (
            <div className="flex justify-end pt-1">
              <Link href="/tutor/assessments" className="btn btn-neutral btn-outline btn-sm text-xs">
                Back to assessments
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
