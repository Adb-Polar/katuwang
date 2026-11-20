"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ReportDownloadButtons from "@/components/reports/ReportDownloadButtons";
import { GroupedBarChart } from "@/components/charts";
import { formatDate } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";

interface ProgressRow {
  classCode: string;
  withdrawnAt?: string | null;
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
  withdrawnAt?: string | null;
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
    data?.series.map((r, index) => ({
      session: `Session ${index + 1}`,
      label: `Session ${index + 1} · ${r.classCode} · ${r.topic} · ${formatDate(r.scheduledAt)}`,
      date: formatDate(r.scheduledAt),
      topic: r.topic,
      classCode: r.classCode,
      delta: r.delta,
      pre: r.preScore,
      post: r.postScore,
    })) ?? [];

  const summary = data?.summary;
  const gain = summary?.avgDelta ?? null;
  const showChart = !loading && !error && data && data.summary.sessionsWithTest > 0;

  return (
    <div className="space-y-4">
      {!compact && classOptions && classOptions.length > 1 && (
        <div className="sm:max-w-sm">
          <FormField label="Class" size="md">
            <select
              value={classId}
              onChange={(e) => { setLoading(true); setError(""); setData(null); setClassId(e.target.value); }}
              className="select select-bordered w-full"
            >
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {subjectDisplayLabel(c.subject)}{c.withdrawnAt ? " · Withdrawn" : ""}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}

      {!compact && (
        <ReportDownloadButtons
          endpoint="/api/learner/report"
          params={{ classId: fixedClassId ?? (classId || undefined) }}
          label={classId ? "Download this class's progress report" : "Download my progress report"}
        />
      )}

      <FeedbackBanner variant="error" message={error || null} />
      {error && <button type="button" onClick={() => { setLoading(true); setError(""); setData(null); setRetryCount((count) => count + 1); }} className="btn btn-outline btn-error min-h-11">Retry loading progress</button>}

      {loading && <p role="status" className="text-sm text-(--kt-muted)">Loading progress…</p>}
      {!loading && !error && summary?.sessionsWithTest === 0 && (
        <section className="card kt-card">
          <div className="kt-card-body gap-3">
            <p>No session tests yet{classId ? " for this class" : ""}. When your tutor publishes one, your scores show up here.</p>
            <Link className="btn btn-primary self-start" href={fixedClassId ? `/learner/classes/${fixedClassId}` : "/learner/my-classes"}>
              {fixedClassId ? "See this class's sessions" : "See my classes"}
            </Link>
          </div>
        </section>
      )}

      {summary && !error && summary.sessionsWithTest > 0 && (
        <section aria-label="Average gain" className="rounded-(--kt-radius-box) border border-(--kt-border) bg-primary/5 px-5 py-4">
          <p className={`font-serif text-4xl leading-tight ${gain != null && gain > 0 ? "text-success" : "text-base-content"}`}>
            {gain == null ? "—" : gain > 0 ? `+${gain}` : gain}
          </p>
          <p className="text-sm text-(--kt-muted)">percentage points · paired tests only</p>
          <p className="mt-2 text-sm">
            {summary.pairedCount} of {summary.sessionsWithTest} session test{summary.sessionsWithTest === 1 ? "" : "s"} {summary.sessionsWithTest === 1 ? "has" : "have"} both your pre-test and post-test score.
          </p>
          {data?.series.some(row => row.withdrawnAt) && <p className="mt-1 text-sm text-(--kt-muted)">Includes classes you withdrew from.</p>}
        </section>
      )}

      {showChart && <GroupedBarChart
        title="Before and after, by session"
        titleAs="h2"
        data={chartData}
        xKey="label"
        tickKey="session"
        unit="%"
        yDomain={[0, 100]}
        minChartWidth={chartData.length >= 4 ? chartData.length * 90 : undefined}
        missingLabel="Not taken yet"
        footer={<p className="text-sm text-(--kt-muted)">Compare the two bars within a session; topics differ between sessions. A missing bar means that test wasn&rsquo;t taken.{chartData.length >= 4 ? " Scroll sideways for more sessions." : ""}</p>}
        tableColumns={[
          { header: "Session", cell: (r) => String(r.session) },
          { header: "Class", cell: (r) => String(r.classCode) },
          { header: "Date (PHT)", cell: (r) => String(r.date) },
          { header: "Topic", cell: (r) => String(r.topic) },
          { header: "Pre-test", align: "right", cell: (r) => r.pre == null ? "Not taken yet" : `${r.pre}%` },
          { header: "Post-test", align: "right", cell: (r) => r.post == null ? "Not taken yet" : `${r.post}%` },
          { header: "Gain", align: "right", cell: (r) => r.delta == null ? "Awaiting paired scores" : `${Number(r.delta) > 0 ? "+" : ""}${r.delta} percentage points` },
        ]}
        series={[
          { key: "pre", name: "Pre-test", color: "oklch(63% 0.05 222)" },
          { key: "post", name: "Post-test", color: "var(--color-primary)" },
        ]}
      />}
    </div>
  );
}
