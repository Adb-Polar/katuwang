"use client";

import { useEffect, useState } from "react";
import LoadErrorState from "@/components/ui/LoadErrorState";
import { GroupedBarChart } from "@/components/charts";
import type { ClassSessionTestRollup } from "@/lib/sessionTestResults";

/** Chart (a) — pre-vs-post average per session, on the tutor's class page. */
export default function ClassProgressPanel({ classId }: { classId: string }) {
  const [data, setData] = useState<ClassSessionTestRollup | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tutor/classes/${classId}/test-results`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load progress.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load progress.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, retryKey]);

  if (error) return <LoadErrorState message={error} onRetry={() => { setError(""); setRetryKey((key) => key + 1); }} />;
  if (!data) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm text-primary" />
      </div>
    );
  }

  const chartData = data.sessions.map((s, i) => ({
    session: `Session ${i + 1}`,
    label: `Session ${i + 1} · ${s.topic}`,
    pre: s.avgPre,
    post: s.avgPost,
  }));

  return (
    <GroupedBarChart
      title="Class average before and after, by session"
      titleAs="h2"
      data={chartData}
      xKey="label"
      tickKey="session"
      series={[
        { key: "pre", name: "Pre-test", color: "oklch(63% 0.05 222)" },
        { key: "post", name: "Post-test", color: "var(--color-primary)" },
      ]}
      unit="%"
      yDomain={[0, 100]}
      emptyHint="No session tests published yet."
      footer={
        data.totals.pairedCount > 0 ? (
          <p className="text-sm text-(--kt-muted)">
            Class average gain: {data.totals.avgDelta! > 0 ? "+" : ""}
            {data.totals.avgDelta} percentage points across {data.totals.pairedCount} paired attempts.
          </p>
        ) : undefined
      }
    />
  );
}
