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
import { Download } from "lucide-react";
import { BarChartCard, DataTable, useThemeColors } from "@/components/charts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { toCsv, downloadCsv } from "@/lib/csv";

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
  enrollments: { total: number; last30Days: number; byDay: { date: string; count: number }[] };
}

export default function ReportsView() {
  const c = useThemeColors();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
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
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  const exportCsv = () => {
    if (!reports) return;
    const sections: [string, Breakdown[], string][] = [
      ["users_by_role", reports.usersByRole, "role"],
      ["users_by_grade_level", reports.usersByGradeLevel, "gradeLevel"],
      ["users_by_status", reports.usersByStatus, "status"],
      ["classes_by_subject", reports.classesBySubject, "subject"],
      ["classes_by_status", reports.classesByStatus, "status"],
      ["certifications_by_status", reports.certificationsByStatus, "status"],
    ];
    const rows: Record<string, string | number>[] = [];
    for (const [section, data, labelKey] of sections) {
      for (const row of data) {
        rows.push({ section, label: String(row[labelKey] ?? ""), count: row.count });
      }
    }
    rows.push({ section: "enrollments_total", label: "total", count: reports.enrollments.total });
    rows.push({
      section: "enrollments_total",
      label: "last_30_days",
      count: reports.enrollments.last30Days,
    });
    for (const d of reports.enrollments.byDay) {
      rows.push({ section: "enrollments_by_day", label: d.date, count: d.count });
    }
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`katuwang-report-${today}.csv`, toCsv(rows, ["section", "label", "count"]));
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {reports && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportCsv}
              className="btn btn-outline btn-sm gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          <div className="stats bg-base-100 shadow-md border border-base-200 w-full sm:w-auto flex-wrap stats-vertical sm:stats-horizontal">
            <div className="stat py-4">
              <div className="stat-title text-2xs">Total Enrollments</div>
              <div className="stat-value text-lg font-sans font-medium">{reports.enrollments.total}</div>
            </div>
            <div className="stat py-4">
              <div className="stat-title text-2xs">Enrollments (Last 30 Days)</div>
              <div className="stat-value text-lg font-sans font-medium">{reports.enrollments.last30Days}</div>
            </div>
          </div>

          <div className="card kt-card">
            <div className="card-body gap-2 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">
                Enrollments — last 30 days
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.enrollments.byDay.map((d) => ({
                      date: d.date.slice(5),
                      count: d.count,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                  >
                    <defs>
                      <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text }} interval={4} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: c.text }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={c.primary}
                      strokeWidth={2}
                      fill="url(#enrollFill)"
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
            <BarChartCard title="Users by Role" rows={reports.usersByRole} labelKey="role" color={c.primary} />
            <BarChartCard
              title="Users by Grade Level"
              rows={reports.usersByGradeLevel}
              labelKey="gradeLevel"
              color={c.primary}
            />
            <BarChartCard
              title="Users by Status"
              rows={reports.usersByStatus}
              labelKey="status"
              color={c.secondary}
            />
            <BarChartCard
              title="Classes by Subject"
              rows={reports.classesBySubject}
              labelKey="subject"
              color={c.primary}
            />
            <BarChartCard
              title="Classes by Status"
              rows={reports.classesByStatus}
              labelKey="status"
              color={c.secondary}
            />
            <BarChartCard
              title="Certifications by Status"
              rows={reports.certificationsByStatus}
              labelKey="status"
              color={c.secondary}
            />
          </div>
        </>
      )}
    </div>
  );
}
