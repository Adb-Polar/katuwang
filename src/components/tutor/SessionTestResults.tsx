"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { QuizQuestionList } from "@/components/quiz/QuizQuestionList";
import { RateBarChart, DeltaBar, type DeltaRow } from "@/components/charts";
import type { SessionTestResults as SessionTestResultsPayload } from "@/lib/sessionTestResults";
import LoadErrorState from "@/components/ui/LoadErrorState";

interface AttemptDetail {
  learner: { anonymousId: string };
  kind: string;
  scorePercent?: number;
  correctCount?: number;
  totalQuestions: number;
  items: {
    position: number;
    questionId: string;
    prompt: string;
    options: { id: string; text: string; isCorrect?: boolean }[];
    selectedOptionId: string | null;
    isCorrect?: boolean | null;
    explanation?: string | null;
  }[];
}

const KIND_LABEL: Record<string, string> = { PRE: "Pre-test", POST: "Post-test" };

function deltaClass(d: number | null) {
  if (d == null) return "text-(--kt-muted)";
  if (d > 0) return "text-success";
  if (d < 0) return "text-error";
  return "text-(--kt-faint)";
}
function fmtDelta(d: number | null) {
  if (d == null) return "—";
  return d > 0 ? `+${d}` : `${d}`;
}

export default function SessionTestResults({
  resultsUrl,
  attemptBaseUrl,
  backHref,
}: {
  resultsUrl: string;
  /** per-attempt detail URL is `${attemptBaseUrl}/${attemptId}` — a string, not a
   *  function, so this component can be rendered directly from a Server Component. */
  attemptBaseUrl: string;
  /** Omit when the parent already renders its own "back" control (e.g. the admin
   *  drill-down) — otherwise there'd be two. */
  backHref?: string;
}) {
  const [data, setData] = useState<SessionTestResultsPayload | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(resultsUrl);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load results.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load results.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resultsUrl, retryKey]);

  const openDetail = async (attemptId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${attemptBaseUrl}/${attemptId}`);
      const json = await res.json();
      if (res.ok) setDetail(json);
    } finally {
      setDetailLoading(false);
    }
  };

  const backControl = backHref ? <BackLink href={backHref}>Back to the test</BackLink> : null;

  if (error) {
    return (
      <div className="space-y-4">
        {backControl}
        <LoadErrorState message={error} onRetry={() => { setError(""); setRetryKey((key) => key + 1); }} />
      </div>
    );
  }
  if (!data) {
    return <p role="status" className="py-16 text-(--kt-muted)">Loading results…</p>;
  }

  const questionRateData = data.questions.map((q) => ({
    label: `Q${q.position + 1}`,
    prompt: q.prompt,
    pre: q.pre.correctRate,
    post: q.post.correctRate,
    deltaRate: q.deltaRate,
  }));

  const deltaRows: DeltaRow[] = data.learners.map((l) => ({
    label: l.anonymousId,
    pre: l.pre,
    post: l.post,
    delta: l.delta,
  }));

  const takers = data.totals.historicalEnrolled ?? data.totals.enrolled;
  const statusWord = data.test.status === "PUBLISHED" ? "Open" : data.test.status === "CLOSED" ? "Closed" : "Draft";
  const pct = (n: number | null | undefined) => (n == null ? "—" : `${n}%`);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {backControl}
        <PageHeader
          eyebrow="Test results"
          title={data.test.title}
          subtitle={`Class ${data.test.classCode} · ${data.test.sessionTopic} · ${statusWord}`}
        />
      </div>

      {/* The four numbers as one readable line instead of four stat tiles. */}
      <div className="space-y-1">
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <span><b className="font-medium">{data.totals.preSubmitted} of {takers}</b> took the pre-test</span>
          <span><b className="font-medium">{data.totals.postSubmitted} of {takers}</b> took the post-test</span>
          <span>
            Average <b className="font-medium">{pct(data.totals.avgPre)}</b> → <b className="font-medium">{pct(data.totals.avgPost)}</b>
          </span>
          <span>
            Average gain <b className={`font-medium ${deltaClass(data.totals.avgDelta)}`}>{fmtDelta(data.totals.avgDelta)}</b>
            <span className="text-(--kt-muted)"> ({data.totals.pairedCount} took both)</span>
          </span>
        </p>
        <p className="text-sm text-(--kt-muted)">
          {data.totals.enrolled} enrolled now. Results include learners who have since left the class.
        </p>
      </div>

      {/* Wide screens: the two charts side by side. */}
      <div className="grid gap-6 items-start xl:grid-cols-2">
      <RateBarChart
        title="Correct answers per question, before and after"
        data={questionRateData}
        series={[
          { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
          { key: "post", name: "Post-test", color: "var(--color-success)" },
        ]}
        emptyHint="No questions yet."
      />

      <DeltaBar title="Change per learner (post − pre)" rows={deltaRows} />
      </div>

      <section aria-labelledby="per-learner" className="kt-card">
        <h2 id="per-learner" className="font-serif text-xl font-medium px-5 py-4 border-b border-(--kt-border)">Each learner</h2>
        {data.learners.length === 0 ? (
          <p className="px-5 py-6">No learners enrolled yet.</p>
        ) : (
          <ul>
            {data.learners.map((l) => (
              <li key={l.anonymousId} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 border-b border-(--kt-border) last:border-b-0">
                <span className="kt-id kt-id--learner text-base w-24">{l.anonymousId}</span>
                <span className="text-sm">
                  <span className="text-(--kt-muted)">Pre </span>{pct(l.pre)}
                  <span className="text-(--kt-muted)"> · Post </span>{pct(l.post)}
                  <span className="text-(--kt-muted)"> · </span>
                  <span className={`font-medium ${deltaClass(l.delta)}`}>{fmtDelta(l.delta)}</span>
                </span>
                <span className="ml-auto flex gap-1">
                  {l.preAttemptId && (
                    <button onClick={() => openDetail(l.preAttemptId!)} className="btn btn-ghost btn-sm text-sm font-normal">
                      View pre-test
                    </button>
                  )}
                  {l.postAttemptId && (
                    <button onClick={() => openDetail(l.postAttemptId!)} className="btn btn-ghost btn-sm text-sm font-normal">
                      View post-test
                    </button>
                  )}
                  {!l.preAttemptId && !l.postAttemptId && <span className="text-sm text-(--kt-muted)">Hasn&apos;t taken either</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        portal
        open={Boolean(detail || detailLoading)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.learner.anonymousId} · ${KIND_LABEL[detail.kind] ?? detail.kind}` : "Loading answers"}
        size="lg"
      >
        {detailLoading || !detail ? (
          <p role="status" className="py-6 text-(--kt-muted)">Loading answers…</p>
        ) : (
          <div className="space-y-4">
            <p>
              <span className="font-serif text-3xl leading-none">{detail.scorePercent}%</span>
              <span className="text-sm text-(--kt-muted)"> · {detail.correctCount} of {detail.totalQuestions} correct</span>
            </p>
            <div className="max-h-[60vh] overflow-y-auto">
              <QuizQuestionList items={detail.items} answers={{}} onAnswer={() => {}} submitted />
            </div>
            <div className="flex justify-end">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
