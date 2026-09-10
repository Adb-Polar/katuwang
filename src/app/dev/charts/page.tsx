import Link from "next/link";
import { notFound } from "next/navigation";
import DevChartLab from "@/components/dev/DevChartLab";

export const metadata = {
  title: "Chart Lab | Katuwang",
};

// Dev-only playground: the real chart components (charts a–d + BarChartCard)
// wired to editable in-memory data, so any data shape — nulls, duplicate
// labels, negatives, empty — can be eyeballed without touching the database.
export default function DevChartsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold text-base-content">Chart Lab</h1>
            <p className="text-xs text-base-content/60">
              The live pre/post analytics chart components (<code className="rounded bg-base-300 px-1">GroupedBarChart</code>,{" "}
              <code className="rounded bg-base-300 px-1">ProgressAreaChart</code>,{" "}
              <code className="rounded bg-base-300 px-1">RateBarChart</code>,{" "}
              <code className="rounded bg-base-300 px-1">DeltaBar</code>,{" "}
              <code className="rounded bg-base-300 px-1">BarChartCard</code>) fed by adjustable dummy data. Not
              available in production.
            </p>
          </div>
          <Link href="/dev" className="btn btn-outline btn-sm shrink-0">
            ← Dev Tools
          </Link>
        </div>

        <DevChartLab />
      </div>
    </div>
  );
}
