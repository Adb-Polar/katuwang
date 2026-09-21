"use client";

import dynamic from "next/dynamic";

// recharts is heavy and this sits below the fold — load it after first paint, client-side only.
const ProgressAreaChart = dynamic(() => import("@/components/charts/ProgressAreaChart"), {
  ssr: false,
  loading: () => <div className="card kt-card h-72" aria-hidden="true" />,
});

const SAMPLE_ROWS = [
  { label: "C-0007 · Fractions", pre: 45, post: 70 },
  { label: "C-0007 · Algebra", pre: 40, post: 80 },
  { label: "C-0007 · Equations", pre: 55, post: 90 },
];

const GAINS = SAMPLE_ROWS.map((row) => row.post - row.pre);
const AVERAGE_GAIN = Math.round(GAINS.reduce((sum, gain) => sum + gain, 0) / GAINS.length);

/** The learner's My Progress view (`/learner/progress`) with sample scores: stat tiles + the pre/post area chart. */
export default function SampleProgress() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="card kt-card kt-stat p-3">
          <span className="kt-stat-title">Sessions with a test</span>
          <span className="kt-stat-value">{SAMPLE_ROWS.length}</span>
        </div>
        <div className="card kt-card kt-stat p-3">
          <span className="kt-stat-title">Paired pre/post</span>
          <span className="kt-stat-value">{SAMPLE_ROWS.length}</span>
        </div>
        <div className="card kt-card kt-stat p-3">
          <span className="kt-stat-title">Avg gain</span>
          <span className="kt-stat-value text-success">+{AVERAGE_GAIN}</span>
        </div>
      </div>

      <ProgressAreaChart
        title="Example · pre vs post score, by session"
        data={SAMPLE_ROWS}
        xKey="label"
        series={[
          { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
          { key: "post", name: "Post-test", color: "var(--color-success)" },
        ]}
      />
    </div>
  );
}
