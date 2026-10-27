"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { ProgressAreaChart } from "@/components/charts";
import { subjectDisplayLabel } from "@/lib/displayLabels";

interface ProgressRow {
  classCode: string;
  subject: string;
  topic: string;
  scheduledAt: string;
  preScore: number | null;
  postScore: number | null;
  delta: number | null;
}
interface ProgressPayload {
  series: ProgressRow[];
  summary: { sessionsWithTest: number; pairedCount: number; avgDelta: number | null };
}

export interface ClassOption {
  id: string;
  code: string;
  subject: string;
}

/**
 * Chart (b) — a learner's own pre/post score across their sessions. No tutor
 * identity, no cohort/class-average anywhere (RA 10173 — see the route).
 */
export default function MyProgressView({
  classOptions,
  fixedClassId,
  compact = false,
}: {
  /** The learner's enrolled classes, for the filter dropdown. Omit in compact mode. */
  classOptions?: ClassOption[];
  /** Pin to one class (e.g. embedded on that class's page) — hides the filter. */
  fixedClassId?: string;
  compact?: boolean;
}) {
  const [classId, setClassId] = useState(fixedClassId ?? "");
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = classId ? `?classId=${classId}` : "";
        const res = await fetch(`/api/learner/progress${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load progress.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, retryCount]);

  const chartData =
    data?.series.map((r) => ({
      label: `${r.classCode} · ${r.topic}`,
      pre: r.preScore,
      post: r.postScore,
    })) ?? [];

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-lg font-sans">My Progress</h1>
          {classOptions && classOptions.length > 0 && (
            <select
              aria-label="Filter progress by class"
              value={classId}
              onChange={(e) => { setLoading(true); setError(""); setData(null); setClassId(e.target.value); }}
              className="select select-bordered select-sm text-xs"
            >
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {subjectDisplayLabel(c.subject)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <FeedbackBanner variant="error" message={error || null} />
      {error && <button type="button" onClick={() => { setLoading(true); setError(""); setData(null); setRetryCount((count) => count + 1); }} className="btn btn-outline btn-error min-h-11">Retry loading progress</button>}

      {loading && <p role="status" className="text-sm text-base-content/60">Loading progress…</p>}
      {!loading && !error && data?.summary.sessionsWithTest === 0 && (
        <div className="rounded-xl border border-base-300 p-4 text-sm space-y-2">
          <p>No session tests have been recorded for this selection yet. Open a class to check upcoming sessions and tests.</p>
          <Link className="link link-primary" href={fixedClassId ? `/learner/classes/${fixedClassId}` : "/learner/my-classes"}>View my classes</Link>
        </div>
      )}
      {data && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card kt-card kt-stat p-4">
            <span className="kt-stat-title">Sessions with a test</span>
            <span className="kt-stat-value">{data.summary.sessionsWithTest}</span>
          </div>
          <div className="card kt-card kt-stat p-4">
            <span className="kt-stat-title">Paired pre/post</span>
            <span className="kt-stat-value">{data.summary.pairedCount}</span>
          </div>
          <div className="card kt-card kt-stat p-4">
            <span className="kt-stat-title">Avg gain</span>
            <span
              className={`kt-stat-value ${
                data.summary.avgDelta == null
                  ? "text-base-content/30"
                  : data.summary.avgDelta > 0
                  ? "text-success"
                  : data.summary.avgDelta < 0
                  ? "text-error"
                  : ""
              }`}
            >
              {data.summary.avgDelta == null
                ? "—"
                : data.summary.avgDelta > 0
                ? `+${data.summary.avgDelta}`
                : data.summary.avgDelta}
            </span>
          </div>
        </div>
      )}

      {!loading && !error && data && data.summary.sessionsWithTest > 0 && <ProgressAreaChart
        title="Pre vs post score, by session"
        data={chartData}
        xKey="label"
        series={[
          { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
          { key: "post", name: "Post-test", color: "var(--color-success)" },
        ]}
      />}
    </div>
  );
}
