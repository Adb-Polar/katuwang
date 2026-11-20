"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChartCard, DataTable, useThemeColors } from "@/components/charts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ReportDownloadButtons from "@/components/reports/ReportDownloadButtons";
import LoadingRow from "@/components/ui/LoadingRow";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";

interface Breakdown {
  count: number;
  [key: string]: string | number;
}

interface ReportsData {
  usersByRole: Breakdown[];
  usersByGradeLevel: Breakdown[];
  usersByStatus: Breakdown[];
  classesBySubject: Breakdown[];
  classesByStatus: Breakdown[];
  certificationsByStatus: Breakdown[];
  enrollments: { total: number; current: number; withdrawn: number; last30Days: number; byDay: { date: string; count: number }[] };
}

const REPORT_SCOPES = [
  ["overview", "Platform overview"],
  ["users", "Users registered"],
  ["classes", "Classes created"],
  ["enrollments", "Enrollments"],
  ["session-tests", "Session tests (pre/post)"],
  ["certifications", "Topic certifications"],
  ["audit-log", "Audit log"],
] as const;

export default function ReportsView() {
  const c = useThemeColors();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [scope, setScope] = useState<string>("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/reports");
        if (!res.ok) throw new Error("Could not retrieve reports.");
        const json = await res.json();
        if (!cancelled) setReports(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not retrieve reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (loading) {
    return (
      <LoadingRow />
    );
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {error && (
        <button type="button" className="btn btn-outline" onClick={() => setRetryKey((key) => key + 1)}>
          Retry reports
        </button>
      )}

      {reports && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                ["Enrollment records, all time", reports.enrollments.total],
                ["Current enrollments", reports.enrollments.current],
                ["Withdrawn", reports.enrollments.withdrawn],
                ["New in the last 30 days", reports.enrollments.last30Days],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-(--kt-muted)">{label}</dt>
                  <dd className="font-serif text-2xl font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <section aria-labelledby="export-reports" className="card kt-card">
            <div className="card-body gap-3 p-5">
              <h2 id="export-reports" className="font-serif text-xl font-medium leading-tight">Generate a report</h2>
              <p className="text-sm text-(--kt-muted)">PDF for printing or submission, CSV for spreadsheets. Exports include real names and emails, so handle them under RA 10173.</p>
              <label className="flex flex-col gap-1 text-xs text-(--kt-muted) sm:max-w-xs">
                Report
                <select className="select select-bordered select-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
                  {REPORT_SCOPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <ReportDownloadButtons endpoint="/api/admin/report" params={{ scope }} label="Date range" />
            </div>
          </section>

          <div className="card kt-card">
            <div className="card-body gap-2 p-5">
              <h2 className="font-serif text-xl font-medium leading-tight">
                Enrollments in the last 30 days
              </h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.enrollments.byDay.map((d) => ({
                      date: d.date.slice(5),
                      count: d.count,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: c.text }} interval={4} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.text }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={c.primary}
                      strokeWidth={2}
                      fill={c.primary}
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <DataTable
                rows={reports.enrollments.byDay.map((d) => ({ date: d.date, count: d.count }))}
                labelKey="date"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartCard title="Users by role" rows={reports.usersByRole} labelKey="role" color={c.primary} labelFormatter={statusDisplayLabel} />
            <BarChartCard
              title="Users by grade level"
              rows={reports.usersByGradeLevel}
              labelKey="gradeLevel"
              color={c.primary}
              labelFormatter={statusDisplayLabel}
            />
            <BarChartCard
              title="Users by status"
              rows={reports.usersByStatus}
              labelKey="status"
              color={c.secondary}
              labelFormatter={statusDisplayLabel}
            />
            <BarChartCard
              title="Classes by subject"
              rows={reports.classesBySubject}
              labelKey="subject"
              color={c.primary}
              labelFormatter={subjectDisplayLabel}
            />
            <BarChartCard
              title="Classes by status"
              rows={reports.classesByStatus}
              labelKey="status"
              color={c.secondary}
              labelFormatter={statusDisplayLabel}
            />
            <BarChartCard
              title="Certifications by status"
              rows={reports.certificationsByStatus}
              labelKey="status"
              color={c.secondary}
              labelFormatter={statusDisplayLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
