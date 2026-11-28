"use client";

import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import {
  ANALYTICS_PERIODS,
  NO_ANALYTICS_FILTERS,
  type AnalyticsChartId,
  type AnalyticsFilters,
  chartTakes,
  isFiltered,
  periodRange,
} from "@/lib/analyticsCharts";

const SELECT_CLASS = "select select-bordered select-sm w-auto";

/** One chart's filter row: only the filters that chart takes, plus its own Clear button. */
export default function ChartFilters({
  chart,
  filters,
  onChange,
  subjectOptions = [],
  loading = false,
}: {
  chart: AnalyticsChartId;
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  subjectOptions?: string[];
  loading?: boolean;
}) {
  const set = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => onChange({ ...filters, [key]: value });
  const waitingForCustomRange = filters.period === "custom" && !periodRange(filters);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Period" className={SELECT_CLASS} value={filters.period} onChange={(e) => set("period", e.target.value as AnalyticsFilters["period"])}>
          {ANALYTICS_PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {filters.period === "custom" && (
          <>
            <input type="date" aria-label="From" className="input input-bordered input-sm w-auto" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} />
            <input type="date" aria-label="To" className="input input-bordered input-sm w-auto" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} />
          </>
        )}
        {chartTakes(chart, "role") && (
          <select aria-label="User role" className={SELECT_CLASS} value={filters.role} onChange={(e) => set("role", e.target.value)}>
            <option value="">All roles</option>
            <option value="STUDENT_LEARNER">Learners</option>
            <option value="STUDENT_TUTOR">Tutors</option>
          </select>
        )}
        {chartTakes(chart, "gradeLevel") && (
          <select aria-label="Grade level" className={SELECT_CLASS} value={filters.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)}>
            <option value="">All grades</option>
            {GRADE_LEVELS.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
          </select>
        )}
        {chartTakes(chart, "subject") && (
          <select aria-label="Subject" className={SELECT_CLASS} value={filters.subject} onChange={(e) => set("subject", e.target.value)}>
            <option value="">All subjects</option>
            {subjectOptions.map((slug) => <option key={slug} value={slug}>{subjectDisplayLabel(slug)}</option>)}
          </select>
        )}
        {isFiltered(chart, filters) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(NO_ANALYTICS_FILTERS)}>
            Clear
          </button>
        )}
        {loading && <span className="loading loading-spinner loading-xs text-primary" aria-label="Updating" />}
      </div>
      {waitingForCustomRange && (
        <p className="text-sm text-(--kt-muted)" role="status">Choose both a start and an end date to apply the range.</p>
      )}
    </div>
  );
}
