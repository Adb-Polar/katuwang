"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable, useThemeColors } from "@/components/charts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import LoadingRow from "@/components/ui/LoadingRow";
import StatCard from "@/components/ui/StatCard";
import { type AnalyticsFilters, NO_ANALYTICS_FILTERS, isFiltered } from "@/lib/analyticsCharts";
import ChartFilters from "./ChartFilters";
import { useAnalyticsChart } from "./useAnalyticsChart";

interface EnrollmentResponse {
  enrollments: {
    total: number;
    current: number;
    withdrawn: number;
    inRange: number;
    bucket: "day" | "month";
    byDay: { date: string; count: number }[];
  };
  subjectOptions?: string[];
}

/** Enrollment stat cards and trend, sharing one set of filters (period, grade level, subject). */
export default function EnrollmentAnalytics() {
  const c = useThemeColors();
  const [filters, setFilters] = useState<AnalyticsFilters>(NO_ANALYTICS_FILTERS);
  const { data, loading, error, retry } = useAnalyticsChart<EnrollmentResponse>("enrollments", filters);
  const periodLabel = filters.period === "all" ? "the last 30 days" : "this period";
  const enrollments = data?.enrollments;

  return (
    <section aria-labelledby="enrollment-analytics" className="card kt-card">
      <div className="card-body gap-4 p-5">
        <h2 id="enrollment-analytics" className="font-serif text-xl font-medium leading-tight">Enrollments</h2>
        <ChartFilters chart="enrollments" filters={filters} onChange={setFilters} subjectOptions={data?.subjectOptions} loading={loading && !!data} />
        <FeedbackBanner variant="error" message={error || null} />
        {error && (
          <button type="button" className="btn btn-outline btn-sm self-start" onClick={retry}>
            Retry
          </button>
        )}
        {!enrollments ? (
          loading && <LoadingRow />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label={isFiltered("enrollments", filters) ? "Enrollment records" : "Enrollment records, all time"} value={enrollments.total} />
              <StatCard label="Current enrollments" value={enrollments.current} />
              <StatCard label="Withdrawn" value={enrollments.withdrawn} />
              <StatCard label={`New in ${periodLabel}`} value={enrollments.inRange} />
            </div>
            <h3 className="font-serif text-lg font-medium leading-tight">
              Enrollments in {periodLabel}
              {enrollments.bucket === "month" ? ", by month" : ""}
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={enrollments.byDay.map((d) => ({
                    date: enrollments.bucket === "month" ? d.date : d.date.slice(5),
                    count: d.count,
                  }))}
                  margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: c.text }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.text }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: c.grid, background: "var(--color-base-100)", color: c.text }} />
                  <Area type="monotone" dataKey="count" stroke={c.primary} strokeWidth={2} fill={c.primary} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <DataTable rows={enrollments.byDay.map((d) => ({ date: d.date, count: d.count }))} labelKey="date" />
          </>
        )}
      </div>
    </section>
  );
}
