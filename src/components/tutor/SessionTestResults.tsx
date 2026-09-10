"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import StatusBadge from "@/components/ui/StatusBadge";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { RateBarChart, DeltaBar, type DeltaRow } from "@/components/charts";
import type { SessionTestResults as SessionTestResultsPayload } from "@/lib/sessionTestResults";

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
  if (d == null) return "text-base-content/30";
  if (d > 0) return "text-success";
  if (d < 0) return "text-error";
  return "text-base-content/50";
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
  }, [resultsUrl]);

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

  const backControl = backHref ? (
    <Link href={backHref} className="btn btn-ghost btn-sm text-xs gap-1.5">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </Link>
  ) : null;

  if (error) {
    return (
      <div className="space-y-4">
        {backControl}
        <FeedbackBanner variant="error" message={error} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {backControl}
        <StatusBadge
          tone={data.test.status === "PUBLISHED" ? "success" : data.test.status === "CLOSED" ? "warning" : "neutral"}
          label={data.test.status.toLowerCase()}
          size="sm"
        />
      </div>

      <div>
        <p className="font-mono text-2xs font-semibold uppercase tracking-wider text-primary/80">
          {data.test.classCode} · {data.test.sessionTopic}
        </p>
        <h1 className="text-lg font-sans">{data.test.title}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Pre-test submitted</span>
          <span className="kt-stat-value">
            {data.totals.preSubmitted} / {data.totals.enrolled}
          </span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Post-test submitted</span>
          <span className="kt-stat-value">
            {data.totals.postSubmitted} / {data.totals.enrolled}
          </span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Avg pre / post</span>
          <span className="kt-stat-value">
            {data.totals.avgPre ?? "—"}% / {data.totals.avgPost ?? "—"}%
          </span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Avg gain ({data.totals.pairedCount} paired)</span>
          <span className={`kt-stat-value ${deltaClass(data.totals.avgDelta)}`}>{fmtDelta(data.totals.avgDelta)}</span>
        </div>
      </div>

      <RateBarChart
        title="Per-question correct rate — pre vs post"
        data={questionRateData}
        series={[
          { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
          { key: "post", name: "Post-test", color: "var(--color-success)" },
        ]}
        emptyHint="No questions yet."
      />

      <DeltaBar title="Per-learner gain (post − pre)" rows={deltaRows} />

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Per learner</h2>
          <div className="overflow-x-auto border border-base-200 rounded-xl">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs">
                  <th>Learner</th>
                  <th>Pre-test</th>
                  <th>Post-test</th>
                  <th>Δ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.learners.map((l) => (
                  <tr key={l.anonymousId} className="text-sm">
                    <td>
                      <AnonymousIdBadge id={l.anonymousId} role="LEARNER" />
                    </td>
                    <td className="text-base-content/70">{l.pre != null ? `${l.pre}%` : "—"}</td>
                    <td className="text-base-content/70">{l.post != null ? `${l.post}%` : "—"}</td>
                    <td className={`font-semibold ${deltaClass(l.delta)}`}>{fmtDelta(l.delta)}</td>
                    <td className="text-right flex gap-1 justify-end">
                      {l.preAttemptId && (
                        <button onClick={() => openDetail(l.preAttemptId!)} className="btn btn-outline btn-xs text-2xs font-bold">
                          Pre
                        </button>
                      )}
                      {l.postAttemptId && (
                        <button onClick={() => openDetail(l.postAttemptId!)} className="btn btn-outline btn-xs text-2xs font-bold">
                          Post
                        </button>
                      )}
                      {!l.preAttemptId && !l.postAttemptId && (
                        <span className="text-2xs text-base-content/30 italic">not taken</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.learners.length === 0 && (
              <div className="text-center py-8 text-base-content/40 italic text-sm">No learners enrolled yet.</div>
            )}
          </div>
        </div>
      </section>

      {(detail || detailLoading) && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl p-6 kt-card space-y-4">
            {detailLoading || !detail ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-base-content">
                      {detail.learner.anonymousId} · {KIND_LABEL[detail.kind] ?? detail.kind}
                    </h3>
                    <p className="text-2xs text-base-content/50 mt-0.5">
                      {detail.scorePercent}% ({detail.correctCount}/{detail.totalQuestions})
                    </p>
                  </div>
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setDetail(null)}>
                    ✕
                  </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {detail.items.map((item) => (
                    <div key={item.questionId} className="border border-base-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-2xs text-base-content/40 shrink-0">Q{item.position + 1}</span>
                        <p className="text-xs font-semibold text-base-content/80">{item.prompt}</p>
                        {item.isCorrect != null && (
                          <span className={`text-2xs shrink-0 ${item.isCorrect ? "text-success" : "text-error"}`}>
                            {item.isCorrect ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {item.options.map((o) => {
                          const chosen = o.id === item.selectedOptionId;
                          return (
                            <li
                              key={o.id}
                              className={`text-2xs rounded-lg px-2 py-1 border ${
                                o.isCorrect
                                  ? "border-success/30 bg-success/5 text-success"
                                  : chosen
                                  ? "border-error/30 bg-error/5 text-error"
                                  : "border-base-200 text-base-content/60"
                              }`}
                            >
                              {o.text}
                              {o.isCorrect && " · correct"}
                              {chosen && " · picked"}
                            </li>
                          );
                        })}
                      </ul>
                      {item.explanation && <p className="text-2xs text-base-content/50 italic">{item.explanation}</p>}
                    </div>
                  ))}
                </div>
                <div className="modal-action pt-1">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
          <label className="modal-backdrop" onClick={() => setDetail(null)} aria-label="Close" />
        </div>
      )}
    </div>
  );
}
