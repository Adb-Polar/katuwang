"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, GraduationCap, RotateCcw, TrendingUp } from "lucide-react";
import { BarChartCard, DataTable, useThemeColors } from "@/components/charts";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import LoadingRow from "@/components/ui/LoadingRow";
import StatCard from "@/components/ui/StatCard";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { toCsv, downloadCsv } from "@/lib/csv";
import { DAY_MS, formatDate } from "@/lib/datetime";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { toLocalDateInput } from "@/lib/sessionTime";

interface Breakdown {
  count: number;
  [key: string]: string | number;
}

interface ReportsData {
  range: { allTime: boolean; from: string | null; to: string | null; trendDays: number };
  usersByRole: Breakdown[];
  usersByGradeLevel: Breakdown[];
  usersByStatus: Breakdown[];
  classesBySubject: Breakdown[];
  classesByStatus: Breakdown[];
  certificationsByStatus: Breakdown[];
  enrollments: { total: number; inPeriod: number; byDay: { date: string; count: number }[] };
}

/** Preset key → number of days ending today. `all` and `custom` carry no day count. */
const PRESET_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };
const PRESET_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last 12 months" },
  { value: "custom", label: "Custom range" },
];
const TARGET_X_TICKS = 8;

interface FilterState {
  range: string;
  from: string;
  to: string;
  gradeLevel: string;
  subject: string;
}

/** The API query for the current filters, or `null` while a custom range is incomplete. */
function buildApiQuery(filters: FilterState): string | null {
  const query = new URLSearchParams();
  if (filters.range === "custom") {
    if (!filters.from || !filters.to) return null;
    query.set("from", filters.from);
    query.set("to", filters.to);
  } else if (filters.range in PRESET_DAYS) {
    const today = new Date();
    query.set("from", toLocalDateInput(new Date(today.getTime() - (PRESET_DAYS[filters.range] - 1) * DAY_MS)));
    query.set("to", toLocalDateInput(today));
  }
  if (filters.gradeLevel) query.set("gradeLevel", filters.gradeLevel);
  if (filters.subject) query.set("subject", filters.subject);
  return query.toString();
}

/**
 * Platform analytics for the admin dashboard: enrollment trend plus user,
 * class and certification breakdowns, filterable by period, grade and subject.
 * Filters live in the URL so a filtered view can be bookmarked or shared.
 */
export default function ReportsView() {
  const c = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { subjects } = useSubjectCatalog();

  const filters: FilterState = {
    range: searchParams.get("range") ?? "all",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    gradeLevel: searchParams.get("grade") ?? "",
    subject: searchParams.get("subject") ?? "",
  };
  const apiQuery = buildApiQuery(filters);
  const isFiltered = filters.range !== "all" || filters.gradeLevel !== "" || filters.subject !== "";

  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (apiQuery === null) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/reports?${apiQuery}`);
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
  }, [apiQuery]);

  const updateFilters = (changes: Partial<Record<"range" | "from" | "to" | "grade" | "subject", string>>) => {
    const next = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (next.get("range") !== "custom") {
      next.delete("from");
      next.delete("to");
    }
    if (next.get("range") === "all") next.delete("range");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const periodLabel = !reports
    ? ""
    : reports.range.allTime
      ? "All time"
      : `${formatDate(`${reports.range.from}T00:00`)} – ${formatDate(`${reports.range.to}T00:00`)}`;
  const trendLabel = reports?.range.allTime ? `last ${reports.range.trendDays} days` : periodLabel;

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
    const rows: Record<string, string | number>[] = [
      { section: "filters", label: "period", count: periodLabel },
      { section: "filters", label: "grade_level", count: filters.gradeLevel || "all" },
      { section: "filters", label: "subject", count: filters.subject || "all" },
    ];
    for (const [section, data, labelKey] of sections) {
      for (const row of data) {
        rows.push({ section, label: String(row[labelKey] ?? ""), count: row.count });
      }
    }
    rows.push({ section: "enrollments_total", label: "total", count: reports.enrollments.total });
    rows.push({ section: "enrollments_total", label: "in_period", count: reports.enrollments.inPeriod });
    for (const d of reports.enrollments.byDay) {
      rows.push({ section: "enrollments_by_day", label: d.date, count: d.count });
    }
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`katuwang-report-${today}.csv`, toCsv(rows, ["section", "label", "count"]));
  };

  const selectCls = "select select-bordered select-sm w-full text-xs";
  const dateCls = "input input-bordered input-sm w-full text-xs";

  return (
    <div className="space-y-6">
      <section className="card kt-card">
        <div className="card-body gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">Filter the charts</h3>
            <div className="flex items-center gap-2">
              {isFiltered && (
                <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="btn btn-ghost btn-sm gap-1.5 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
              <button type="button" onClick={exportCsv} disabled={!reports} className="btn btn-outline btn-sm gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <FormField label="Period">
              <select value={filters.range} onChange={(e) => updateFilters({ range: e.target.value })} className={selectCls}>
                {PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            {filters.range === "custom" && (
              <>
                <FormField label="From" required>
                  <input
                    type="date"
                    value={filters.from}
                    max={filters.to || undefined}
                    onChange={(e) => updateFilters({ from: e.target.value })}
                    className={dateCls}
                  />
                </FormField>
                <FormField label="To" required>
                  <input
                    type="date"
                    value={filters.to}
                    min={filters.from || undefined}
                    onChange={(e) => updateFilters({ to: e.target.value })}
                    className={dateCls}
                  />
                </FormField>
              </>
            )}
            <FormField label="Grade level">
              <select value={filters.gradeLevel} onChange={(e) => updateFilters({ grade: e.target.value })} className={selectCls}>
                <option value="">All grades</option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Subject">
              <select value={filters.subject} onChange={(e) => updateFilters({ subject: e.target.value })} className={selectCls}>
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.slug} value={subject.slug}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <p className="text-2xs text-base-content/60">
            {apiQuery === null
              ? "Pick both a start and an end date to apply the custom range."
              : "Dates filter by when each record was created. Grade applies to users, classes and enrollments; subject applies to classes, certifications and enrollments."}
          </p>
        </div>
      </section>

      <FeedbackBanner variant="error" message={error || null} />

      {loading && !reports && <LoadingRow />}

      {reports && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label={isFiltered ? "Enrollments (matching grade/subject)" : "Total enrollments"}
              value={reports.enrollments.total}
              icon={GraduationCap}
              tint="primary"
            />
            <StatCard label={`Enrollments — ${trendLabel}`} value={reports.enrollments.inPeriod} icon={TrendingUp} tint="success" />
          </div>

          <div className="card kt-card">
            <div className="card-body gap-2 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">Enrollments — {trendLabel}</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.enrollments.byDay.map((d) => ({ date: d.date.slice(5), count: d.count }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                  >
                    <defs>
                      <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: c.text }}
                      interval={Math.max(0, Math.ceil(reports.enrollments.byDay.length / TARGET_X_TICKS) - 1)}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: c.text }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }} />
                    <Area type="monotone" dataKey="count" stroke={c.primary} strokeWidth={2} fill="url(#enrollFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <DataTable rows={reports.enrollments.byDay.map((d) => ({ date: d.date, count: d.count }))} labelKey="date" />
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">
            Breakdowns — {periodLabel}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartCard title="Users by Role" rows={reports.usersByRole} labelKey="role" color={c.primary} />
            <BarChartCard title="Users by Grade Level" rows={reports.usersByGradeLevel} labelKey="gradeLevel" color={c.primary} />
            <BarChartCard title="Users by Status" rows={reports.usersByStatus} labelKey="status" color={c.secondary} />
            <BarChartCard title="Classes by Subject" rows={reports.classesBySubject} labelKey="subject" color={c.primary} />
            <BarChartCard title="Classes by Status" rows={reports.classesByStatus} labelKey="status" color={c.secondary} />
            <BarChartCard
              title="Certifications by Status"
              rows={reports.certificationsByStatus}
              labelKey="status"
              color={c.secondary}
            />
          </div>
        </div>
      )}
    </div>
  );
}
