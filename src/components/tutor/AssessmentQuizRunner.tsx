"use client";

import { useState } from "react";
import Link from "next/link";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import { QuizQuestionList, QuizResult, QuizSubmitBar, type QuizListItem } from "@/components/quiz/QuizQuestionList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { subjectDisplayLabel } from "@/lib/displayLabels";

export type QuizItem = QuizListItem;
export interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  certificationEligible?: boolean;
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
  const practiceOnly = attempt.certificationEligible === false;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-3">
        <BackLink href="/tutor/assessments">Back to assessments</BackLink>
        <PageHeader
          eyebrow="Topic assessment"
          title={attempt.topic}
          subtitle={`${subjectDisplayLabel(attempt.subject)} · ${attempt.questionCount} questions · pass mark ${attempt.passPercent}% · attempt ${attempt.attemptNo}`}
        />
      </div>

      {submitted && (
        <QuizResult
          scorePercent={attempt.scorePercent}
          verdict={
            <span className={practiceOnly ? "" : passed ? "text-success" : "text-error"}>
              {practiceOnly ? "Practice result" : passed ? "Passed" : "Not passed"}
            </span>
          }
          correct={attempt.correctCount}
          total={attempt.questionCount}
        >
          <p>
            {practiceOnly
              ? "This attempt used demo or unreviewed questions, so it can't verify you. A reviewed assessment or an admin review is needed."
              : passed
              ? "Your result is recorded. Your topic status is on the Assessments page."
              : `You need ${attempt.passPercent}% to pass. You can retake it from the Assessments page.`}
          </p>
        </QuizResult>
      )}

      <FeedbackBanner variant="error" message={error || null} />

      <QuizQuestionList
        items={attempt.items}
        answers={answers}
        onAnswer={(questionId, optionId) => setAnswers((prev) => ({ ...prev, [questionId]: optionId }))}
        submitted={submitted}
        topic={attempt.topic}
      />

      {submitted ? (
        <div className="flex justify-end">
          <Link href="/tutor/assessments" className="btn btn-outline">Back to assessments</Link>
        </div>
      ) : (
        <QuizSubmitBar
          answered={answeredCount}
          total={attempt.items.length}
          submitting={submitting}
          label="Submit assessment"
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
