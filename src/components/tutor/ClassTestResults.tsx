"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import StatusBadge from "@/components/ui/StatusBadge";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

interface LearnerRow {
  id: string;
  anonymousId: string;
  attemptId: string | null;
  score: number | null;
  submittedAt: string | null;
  siblingScore: number | null;
  delta: number | null;
}
interface Results {
  test: { id: string; kind: string; title: string; status: string; classCode: string };
  siblingKind: "PRE" | "POST" | null;
  totals: {
    enrolled: number;
    submitted: number;
    avgScore: number | null;
    avgSiblingScore: number | null;
    avgDelta: number | null;
  };
  learners: LearnerRow[];
  questionStats: { position: number; prompt: string; answered: number; correct: number; correctRate: number | null }[];
}
interface AttemptDetail {
  learner: { id: string; anonymousId: string };
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

export default function ClassTestResults({
  resultsUrl,
  attemptUrl,
  backHref,
  onBack,
}: {
  resultsUrl: string;
  /** builds the per-attempt detail URL */
  attemptUrl: (attemptId: string) => string;
  backHref: string;
  /** when set, the back control is a button instead of a link */
  onBack?: () => void;
}) {
  const backControl = onBack ? (
    <button onClick={onBack} className="btn btn-ghost btn-sm text-xs gap-1.5">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  ) : (
    <Link href={backHref} className="btn btn-ghost btn-sm text-xs gap-1.5">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </Link>
  );
  const [data, setData] = useState<Results | null>(null);
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
      const res = await fetch(attemptUrl(attemptId));
      const json = await res.json();
      if (res.ok) setDetail(json);
    } finally {
      setDetailLoading(false);
    }
  };

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
          {data.test.classCode} · {KIND_LABEL[data.test.kind] ?? data.test.kind}
        </p>
        <h1 className="text-lg font-serif">{data.test.title}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Submitted</span>
          <span className="kt-stat-value">
            {data.totals.submitted} / {data.totals.enrolled}
          </span>
        </div>
        <div className="card kt-card kt-stat p-4">
          <span className="kt-stat-title">Avg {KIND_LABEL[data.test.kind]?.toLowerCase()}</span>
          <span className="kt-stat-value">{data.totals.avgScore ?? "—"}%</span>
        </div>
        {data.siblingKind && (
          <>
            <div className="card kt-card kt-stat p-4">
              <span className="kt-stat-title">Avg {KIND_LABEL[data.siblingKind]?.toLowerCase()}</span>
              <span className="kt-stat-value">{data.totals.avgSiblingScore ?? "—"}%</span>
            </div>
            <div className="card kt-card kt-stat p-4">
              <span className="kt-stat-title">Avg improvement</span>
              <span className={`kt-stat-value ${deltaClass(data.totals.avgDelta)}`}>
                {fmtDelta(data.totals.avgDelta)}
              </span>
            </div>
          </>
        )}
      </div>

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Per learner</h2>
          <div className="overflow-x-auto border border-base-200 rounded-xl">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs">
                  <th>Learner</th>
                  <th>{KIND_LABEL[data.test.kind]}</th>
                  {data.siblingKind && <th>{KIND_LABEL[data.siblingKind]}</th>}
                  {data.siblingKind && <th>Δ</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.learners.map((l) => (
                  <tr key={l.id} className="text-sm">
                    <td>
                      <AnonymousIdBadge id={l.anonymousId} role="LEARNER" />
                    </td>
                    <td className="text-base-content/70">{l.score != null ? `${l.score}%` : "—"}</td>
                    {data.siblingKind && (
                      <td className="text-base-content/70">
                        {l.siblingScore != null ? `${l.siblingScore}%` : "—"}
                      </td>
                    )}
                    {data.siblingKind && (
                      <td className={`font-semibold ${deltaClass(l.delta)}`}>{fmtDelta(l.delta)}</td>
                    )}
                    <td className="text-right">
                      {l.attemptId ? (
                        <button
                          onClick={() => openDetail(l.attemptId!)}
                          className="btn btn-outline btn-xs text-2xs font-bold"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-2xs text-base-content/30 italic">not taken</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.learners.length === 0 && (
              <div className="text-center py-8 text-base-content/40 italic text-sm">
                No learners enrolled yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Per question</h2>
          <ul className="space-y-2">
            {data.questionStats.map((s) => (
              <li key={s.position} className="flex items-start gap-3 text-xs border border-base-200 rounded-xl p-3">
                <span className="text-2xs text-base-content/40 pt-0.5 shrink-0">Q{s.position + 1}</span>
                <span className="flex-1 min-w-0 text-base-content/80">{s.prompt}</span>
                <span className="shrink-0 text-2xs text-base-content/60">
                  {s.correctRate != null ? `${s.correctRate}% correct` : "no answers"}{" "}
                  ({s.correct}/{s.answered})
                </span>
              </li>
            ))}
          </ul>
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
                      {item.explanation && (
                        <p className="text-2xs text-base-content/50 italic">{item.explanation}</p>
                      )}
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
