"use client";

import { useState } from "react";
import { BarChartCard } from "@/components/charts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import LoadingRow from "@/components/ui/LoadingRow";
import { type AnalyticsChartId, type AnalyticsFilters, NO_ANALYTICS_FILTERS } from "@/lib/analyticsCharts";
import ChartFilters from "./ChartFilters";
import { useAnalyticsChart } from "./useAnalyticsChart";

interface BreakdownResponse {
  rows: { count: number; [key: string]: string | number }[];
  subjectOptions?: string[];
}

/** A bar chart from `GET /api/admin/reports` with its own filters. */
export default function BreakdownChartCard({
  chart,
  title,
  labelKey,
  color,
  labelFormatter,
}: {
  chart: Exclude<AnalyticsChartId, "enrollments">;
  title: string;
  labelKey: string;
  color: string;
  labelFormatter?: (value: string) => string;
}) {
  const [filters, setFilters] = useState<AnalyticsFilters>(NO_ANALYTICS_FILTERS);
  const { data, loading, error, retry } = useAnalyticsChart<BreakdownResponse>(chart, filters);

  const toolbar = (
    <>
      <ChartFilters chart={chart} filters={filters} onChange={setFilters} subjectOptions={data?.subjectOptions} loading={loading && !!data} />
      <FeedbackBanner variant="error" message={error || null} />
      {error && (
        <button type="button" className="btn btn-outline btn-sm self-start" onClick={retry}>
          Retry
        </button>
      )}
    </>
  );

  if (!data) {
    return (
      <div className="card kt-card">
        <div className="card-body gap-2 p-5">
          <h2 className="font-serif text-xl font-medium leading-tight">{title}</h2>
          {toolbar}
          {loading && <LoadingRow />}
        </div>
      </div>
    );
  }

  return <BarChartCard title={title} rows={data.rows} labelKey={labelKey} color={color} labelFormatter={labelFormatter} toolbar={toolbar} />;
}
