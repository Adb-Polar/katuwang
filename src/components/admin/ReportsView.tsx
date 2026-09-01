"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

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

const FALLBACK_COLORS = {
  primary: "#2f6f68",
  secondary: "#6b4bb3",
  grid: "#e5e5e5",
  text: "#3a3a3a",
};

/** Reads the DaisyUI OKLCH theme tokens so charts match the rest of the app. */
function useThemeColors() {
  const [colors] = useState(() => {
    if (typeof window === "undefined") return FALLBACK_COLORS;
    const s = getComputedStyle(document.documentElement);
    const get = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback;
    return {
      primary: get("--color-primary", FALLBACK_COLORS.primary),
      secondary: get("--color-secondary", FALLBACK_COLORS.secondary),
      grid: get("--color-base-300", FALLBACK_COLORS.grid),
      text: get("--color-base-content", FALLBACK_COLORS.text),
    };
  });

  return colors;
}

function labelize(v: string | number) {
  return String(v).replace(/_/g, " ");
}

function DataTable({ rows, labelKey }: { rows: Breakdown[]; labelKey: string }) {
  return (
    <details className="mt-2">
      <summary className="text-2xs text-base-content/50 cursor-pointer hover:text-base-content/70">
        Show data table
      </summary>
      <table className="table table-xs mt-2">
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[labelKey])}>
              <td className="text-base-content/70">{labelize(r[labelKey])}</td>
              <td className="text-right font-semibold">{r.count}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="text-center py-3 text-base-content/40 italic text-xs">
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </details>
  );
}

function BarChartCard({
  title,
  rows,
  labelKey,
  color,
}: {
  title: string;
  rows: Breakdown[];
  labelKey: string;
  color: string;
}) {
  const c = useThemeColors();
  const data = rows.map((r) => ({ name: labelize(r[labelKey]), count: r.count }));

  return (
    <div className="card kt-card">
      <div className="card-body gap-2 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">{title}</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: c.text }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={48}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: c.text }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }}
                cursor={{ fill: c.grid, opacity: 0.4 }}
              />
              <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DataTable rows={rows} labelKey={labelKey} />
      </div>
    </div>
  );
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

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {reports && (
        <>
          <div className="stats bg-base-100 shadow-md border border-base-200 w-full sm:w-auto flex-wrap stats-vertical sm:stats-horizontal">
            <div className="stat py-4">
              <div className="stat-title text-2xs">Total Enrollments</div>
              <div className="stat-value text-lg font-serif">{reports.enrollments.total}</div>
            </div>
            <div className="stat py-4">
              <div className="stat-title text-2xs">Enrollments (Last 30 Days)</div>
              <div className="stat-value text-lg font-serif">{reports.enrollments.last30Days}</div>
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
