"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import StatCard from "@/components/ui/StatCard";
import { DAY_MS, formatDate, parseLocalDateAndTime } from "@/lib/datetime";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
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
  enrollments: {
    total: number;
    current: number;
    withdrawn: number;
    inRange: number;
    bucket: "day" | "month";
    byDay: { date: string; count: number }[];
  };
  subjectOptions: string[];
}

interface Filters {
  /** "all" = all-time breakdowns with a 30-day trend; a number = the last N days; "custom" = from/to. */
  period: "all" | "7" | "30" | "90" | "365" | "custom";
  from: string;
  to: string;
  role: string;
  gradeLevel: string;
  subject: string;
}

const NO_FILTERS: Filters = { period: "all", from: "", to: "", role: "", gradeLevel: "", subject: "" };

const PERIODS: [Filters["period"], string][] = [
  ["all", "All time"],
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["90", "Last 90 days"],
  ["365", "Last 12 months"],
  ["custom", "Custom range"],
];

const localDate = (date: Date) => parseLocalDateAndTime(date).date;

/** The from/to pair a period stands for; null when it is all-time or an incomplete custom range. */
function periodRange(filters: Filters): { from: string; to: string } | null {
  if (filters.period === "all") return null;
  if (filters.period === "custom") return filters.from && filters.to ? { from: filters.from, to: filters.to } : null;
  const today = new Date();
  return { from: localDate(new Date(today.getTime() - (Number(filters.period) - 1) * DAY_MS)), to: localDate(today) };
}

function reportsQuery(filters: Filters): string {
  const params = new URLSearchParams();
  const range = periodRange(filters);
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  for (const key of ["role", "gradeLevel", "subject"] as const) if (filters[key]) params.set(key, filters[key]);
  const query = params.toString();
  return query ? `?${query}` : "";
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

const SELECT_CLASS = "select select-bordered w-full";
const FILTER_LABEL = "flex flex-col gap-1 text-sm text-(--kt-muted)";

export default function ReportsView() {
  const c = useThemeColors();
  const { data: session } = useSession();
  // The audit log is super-admin only, and so is its export.
  const reportScopes = REPORT_SCOPES.filter(([value]) => value !== "audit-log" || session?.user?.role === "SUPER_ADMIN");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const query = reportsQuery(filters);
  const waitingForCustomRange = filters.period === "custom" && !periodRange(filters);
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
        const res = await fetch(`/api/admin/reports${query}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not retrieve reports.");
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
  }, [retryKey, query]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const filtered = query !== "";
  const periodLabel = filters.period === "all" ? "the last 30 days" : "this period";

  if (loading && !reports) {
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
          <section aria-labelledby="analytics-filters" className="card kt-card">
            <div className="card-body gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="analytics-filters" className="font-serif text-xl font-medium leading-tight">Filter the charts</h2>
                {filtered && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilters(NO_FILTERS)}>
                    Clear filters
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className={FILTER_LABEL}>
                  Period
                  <select className={SELECT_CLASS} value={filters.period} onChange={(e) => setFilter("period", e.target.value as Filters["period"])}>
                    {PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className={FILTER_LABEL}>
                  User role
                  <select className={SELECT_CLASS} value={filters.role} onChange={(e) => setFilter("role", e.target.value)}>
                    <option value="">All roles</option>
                    <option value="STUDENT_LEARNER">Learners</option>
                    <option value="STUDENT_TUTOR">Tutors</option>
                  </select>
                </label>
                <label className={FILTER_LABEL}>
                  Grade level
                  <select className={SELECT_CLASS} value={filters.gradeLevel} onChange={(e) => setFilter("gradeLevel", e.target.value)}>
                    <option value="">All grades</option>
                    {GRADE_LEVELS.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
                  </select>
                </label>
                <label className={FILTER_LABEL}>
                  Subject
                  <select className={SELECT_CLASS} value={filters.subject} onChange={(e) => setFilter("subject", e.target.value)}>
                    <option value="">All subjects</option>
                    {reports.subjectOptions.map((slug) => <option key={slug} value={slug}>{subjectDisplayLabel(slug)}</option>)}
                  </select>
                </label>
                {filters.period === "custom" && (
                  <>
                    <label className={FILTER_LABEL}>
                      From
                      <input type="date" className="input input-bordered w-full" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter("from", e.target.value)} />
                    </label>
                    <label className={FILTER_LABEL}>
                      To
                      <input type="date" className="input input-bordered w-full" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter("to", e.target.value)} />
                    </label>
                  </>
                )}
              </div>
              <p className="text-sm text-(--kt-muted)" role="status">
                {waitingForCustomRange
                  ? "Choose both a start and an end date to apply the custom range."
                  : filters.period === "all"
                    ? "Showing all records. The enrollment trend covers the last 30 days."
                    : `Showing records created from ${formatDate(`${periodRange(filters)!.from}T00:00:00+08:00`)} to ${formatDate(`${periodRange(filters)!.to}T00:00:00+08:00`)}.`}
                {loading && " Updating…"}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={filtered ? "Enrollment records" : "Enrollment records, all time"} value={reports.enrollments.total} />
            <StatCard label="Current enrollments" value={reports.enrollments.current} />
            <StatCard label="Withdrawn" value={reports.enrollments.withdrawn} />
            <StatCard label={`New in ${periodLabel}`} value={reports.enrollments.inRange} />
          </div>

          <section aria-labelledby="export-reports" className="card kt-card">
            <div className="card-body gap-3 p-5">
              <h2 id="export-reports" className="font-serif text-xl font-medium leading-tight">Generate a report</h2>
              <p className="text-sm text-(--kt-muted)">PDF for printing or submission, CSV for spreadsheets. Exports include real names and emails, so handle them under RA 10173.</p>
              <label className="flex flex-col gap-1 text-xs text-(--kt-muted) sm:max-w-xs">
                Report
                <select className="select select-bordered select-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
                  {reportScopes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <ReportDownloadButtons endpoint="/api/admin/report" params={{ scope }} label="Date range" />
            </div>
          </section>

          <div className="card kt-card">
            <div className="card-body gap-2 p-5">
              <h2 className="font-serif text-xl font-medium leading-tight">
                Enrollments in {periodLabel}
                {reports.enrollments.bucket === "month" ? ", by month" : ""}
              </h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.enrollments.byDay.map((d) => ({
                      date: reports.enrollments.bucket === "month" ? d.date : d.date.slice(5),
                      count: d.count,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: c.text }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.text }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: c.grid, background: "var(--color-base-100)", color: c.text }} />
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
