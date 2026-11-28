"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { displayPrompt } from "@/lib/questionText";

export interface QuizListOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}
export interface QuizListItem {
  position: number;
  questionId: string;
  prompt: string;
  options: QuizListOption[];
  selectedOptionId: string | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

const blockEvent = (event: SyntheticEvent) => event.preventDefault();

/**
 * The questions of a quiz (tutor topic assessment, learner pre/post-test): one card of numbered questions, answers as
 * full-size rows, and — once graded — the correct answer and a wrong pick marked in words.
 */
export function QuizQuestionList({
  items,
  answers,
  onAnswer,
  submitted,
  topic,
}: {
  items: QuizListItem[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  submitted: boolean;
  /** Strips a "[topic]" prefix from bank prompts; any leading bracket when omitted. */
  topic?: string;
}) {
  // While the quiz is being taken its text cannot be selected, copied, cut, dragged out or
  // reached through the context menu. This is a deterrent, not a guarantee (a screenshot still
  // works); the graded review afterwards is ordinary selectable text.
  const guard = submitted ? {} : { onCopy: blockEvent, onCut: blockEvent, onContextMenu: blockEvent, onDragStart: blockEvent };

  return (
    <ol className={`kt-card ${submitted ? "" : "select-none"}`} data-copy-protected={submitted ? undefined : "true"} {...guard}>
      {items.map((item) => {
        const chosen = answers[item.questionId] ?? item.selectedOptionId;
        return (
          <li key={item.questionId} className="px-5 py-5 border-b border-(--kt-border) last:border-b-0">
            <fieldset className="space-y-3">
              <legend className="flex items-start gap-3">
                <span className="font-serif text-lg leading-snug text-(--kt-muted) w-6 shrink-0 tabular-nums">
                  {item.position + 1}
                </span>
                <span className="font-medium leading-snug">{displayPrompt(item.prompt, topic)}</span>
              </legend>

              <div className="space-y-2 sm:pl-9">
                {item.options.map((o) => {
                  const isChosen = chosen === o.id;
                  const optionIsCorrect = o.isCorrect ?? (isChosen ? item.isCorrect : undefined);
                  const tone = submitted
                    ? optionIsCorrect
                      ? "border-success bg-success/5"
                      : isChosen && optionIsCorrect === false
                      ? "border-error bg-error/5"
                      : isChosen
                      ? "border-primary bg-primary/5"
                      : "border-(--kt-border)"
                    : isChosen
                    ? "border-primary bg-primary/5"
                    : "border-(--kt-border) hover:border-primary";
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center gap-3 rounded-field border px-3 py-2.5 ${tone} ${submitted ? "" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name={item.questionId}
                        className="radio radio-sm radio-primary"
                        checked={isChosen}
                        disabled={submitted}
                        onChange={() => onAnswer(item.questionId, o.id)}
                      />
                      <span className="min-w-0">{o.text}</span>
                      {submitted && optionIsCorrect === true && (
                        <span className="ml-auto shrink-0 text-sm font-medium text-success">Correct answer</span>
                      )}
                      {submitted && isChosen && optionIsCorrect === false && (
                        <span className="ml-auto shrink-0 text-sm font-medium text-error">Your answer</span>
                      )}
                    </label>
                  );
                })}
              </div>

              {submitted && item.explanation && <p className="text-sm text-(--kt-muted) sm:pl-9">{item.explanation}</p>}
            </fieldset>
          </li>
        );
      })}
    </ol>
  );
}

/** The graded result: the score as a large serif number, a short verdict, "N of M correct", and what comes next. */
export function QuizResult({
  scorePercent,
  verdict,
  correct,
  total,
  children,
}: {
  scorePercent?: number;
  /** e.g. "Passed" in green, or a neutral word for tests without pass/fail. */
  verdict: ReactNode;
  correct?: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <section aria-label="Result" className="kt-card kt-card-body gap-2">
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-serif text-4xl leading-none">{scorePercent}%</span>
        <span className="font-medium">{verdict}</span>
        <span className="text-sm text-(--kt-muted)">
          {correct} of {total} correct
        </span>
      </p>
      <div className="text-sm space-y-1">{children}</div>
    </section>
  );
}

/** "N of M answered" with the submit button; one row under the questions. */
export function QuizSubmitBar({
  answered,
  total,
  submitting,
  label,
  onSubmit,
}: {
  answered: number;
  total: number;
  submitting: boolean;
  label: string;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      <span className="text-sm text-(--kt-muted)" aria-live="polite">
        {answered} of {total} answered
      </span>
      <button onClick={onSubmit} disabled={submitting || answered === 0} className="btn btn-primary">
        {submitting && <span className="loading loading-spinner loading-sm" />}
        {label}
      </button>
    </div>
  );
}

/**
 * Quiz page body. Wide screens: questions on the left, the timer and submit action beside them and kept in view.
 * Narrow screens: the timer stays on top (the aside becomes `contents`, so its sticky timer still sticks) and the
 * action sits under the questions.
 */
export function QuizLayout({ timer, action, children }: { timer?: ReactNode; action: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-6 items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
      <aside className="contents xl:order-last xl:sticky xl:top-6 xl:block xl:space-y-4">
        {timer}
        <div className="hidden xl:block">{action}</div>
      </aside>
      <div className="min-w-0">{children}</div>
      <div className="xl:hidden">{action}</div>
    </div>
  );
}
