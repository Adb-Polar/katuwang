"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import { QuizQuestionList, QuizResult, QuizSubmitBar, type QuizListItem, type QuizListOption } from "@/components/quiz/QuizQuestionList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type SessionTestRunnerOption = QuizListOption;
export type SessionTestRunnerItem = QuizListItem;
export interface SessionTestRunnerAttempt {
  id: string;
  kind: "PRE" | "POST";
  title: string;
  instructions: string | null;
  status: "IN_PROGRESS" | "SUBMITTED";
  totalQuestions: number;
  correctCount?: number;
  scorePercent?: number;
  answersRevealed?: boolean;
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
    return <p role="status" className="py-16 text-(--kt-muted)">Loading the test…</p>;
  }
  if (!attempt) {
    return (
      <div className="space-y-4">
        <BackLink href={`/learner/classes/${classId}`}>Back to class</BackLink>
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

  const kindLabel = KIND_LABEL[attempt.kind] ?? attempt.kind;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-3">
        <BackLink href={`/learner/classes/${classId}`}>Back to class</BackLink>
        <PageHeader
          eyebrow={kindLabel}
          title={attempt.title}
          subtitle={`${attempt.totalQuestions} questions · no pass or fail; it shows what you know ${attempt.kind === "PRE" ? "before" : "after"} the session`}
        />
      </div>

      {attempt.instructions && !submitted && <p className="max-w-prose whitespace-pre-line">{attempt.instructions}</p>}

      {submitted && (
        <QuizResult
          scorePercent={attempt.scorePercent}
          verdict={
            delta == null ? (
              <span>{kindLabel} done</span>
            ) : (
              <span className={delta > 0 ? "text-success" : ""}>
                {delta > 0 ? `Up ${delta} points` : delta < 0 ? `Down ${Math.abs(delta)} points` : "Same as before"}
              </span>
            )
          }
          correct={attempt.correctCount}
          total={attempt.totalQuestions}
        >
          {delta != null && <p>Your pre-test score was {preScore}%.</p>}
          {attempt.answersRevealed === false && (
            <p className="text-(--kt-muted)">You&apos;ll see the right answers after you submit the post-test.</p>
          )}
        </QuizResult>
      )}

      <FeedbackBanner variant="error" message={error || null} />

      <QuizQuestionList
        items={attempt.items}
        answers={answers}
        onAnswer={(questionId, optionId) => setAnswers((prev) => ({ ...prev, [questionId]: optionId }))}
        submitted={submitted}
      />

      {submitted ? (
        <div className="flex justify-end">
          <Link href={`/learner/classes/${classId}`} className="btn btn-outline">Back to class</Link>
        </div>
      ) : (
        <QuizSubmitBar
          answered={answeredCount}
          total={attempt.items.length}
          submitting={submitting}
          label="Submit test"
          onSubmit={() => (allAnswered ? doSubmit() : setConfirmOpen(true))}
        />
      )}

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
