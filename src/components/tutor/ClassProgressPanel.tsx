"use client";

import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { GroupedBarChart } from "@/components/charts";
import type { ClassSessionTestRollup } from "@/lib/sessionTestResults";

/** Chart (a) — pre-vs-post average per session, on the tutor's class page. */
export default function ClassProgressPanel({ classId }: { classId: string }) {
  const [data, setData] = useState<ClassSessionTestRollup | null>(null);
  const [error, setError] = useState("");

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
  }, [classId]);

  if (error) return <FeedbackBanner variant="error" message={error} />;
  if (!data) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm text-primary" />
      </div>
    );
  }

  const chartData = data.sessions.map((s) => ({
    label: s.topic,
    pre: s.avgPre,
    post: s.avgPost,
  }));

  return (
    <GroupedBarChart
      title="Pre vs post average, by session"
      data={chartData}
      xKey="label"
      series={[
        { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
        { key: "post", name: "Post-test", color: "var(--color-success)" },
      ]}
      unit="%"
      yDomain={[0, 100]}
      emptyHint="No session tests published yet."
      footer={
        data.totals.pairedCount > 0 ? (
          <p className="text-2xs text-base-content/50">
            Class-wide avg gain: {data.totals.avgDelta! > 0 ? "+" : ""}
            {data.totals.avgDelta}% across {data.totals.pairedCount} paired attempts.
          </p>
        ) : undefined
      }
    />
  );
}
