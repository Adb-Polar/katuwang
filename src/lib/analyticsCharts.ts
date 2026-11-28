import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";

/**
 * Admin dashboard charts and the filters each one takes. A chart never takes the field it groups
 * by. Shared by `GET /api/admin/reports` and the dashboard, so both agree on what applies.
 * Client-safe: no Prisma imports.
 */
export const ANALYTICS_CHART_FILTERS = {
  enrollments: ["period", "gradeLevel", "subject"],
  usersByRole: ["period", "gradeLevel"],
  usersByGradeLevel: ["period", "role"],
  usersByStatus: ["period", "role", "gradeLevel"],
  classesBySubject: ["period", "gradeLevel"],
  classesByStatus: ["period", "gradeLevel", "subject"],
  certificationsByStatus: ["period", "gradeLevel", "subject"],
} as const satisfies Record<string, readonly AnalyticsFilterKey[]>;

export type AnalyticsFilterKey = "period" | "role" | "gradeLevel" | "subject";
export type AnalyticsChartId = keyof typeof ANALYTICS_CHART_FILTERS;
export const ANALYTICS_CHART_IDS = Object.keys(ANALYTICS_CHART_FILTERS) as [AnalyticsChartId, ...AnalyticsChartId[]];

export function chartTakes(chart: AnalyticsChartId, key: AnalyticsFilterKey): boolean {
  return (ANALYTICS_CHART_FILTERS[chart] as readonly AnalyticsFilterKey[]).includes(key);
}

export interface AnalyticsFilters {
  /** "all" = all time (the enrollment trend then covers the last 30 days); a number = the last N days; "custom" = from/to. */
  period: "all" | "7" | "30" | "90" | "365" | "custom";
  from: string;
  to: string;
  role: string;
  gradeLevel: string;
  subject: string;
}

export const NO_ANALYTICS_FILTERS: AnalyticsFilters = { period: "all", from: "", to: "", role: "", gradeLevel: "", subject: "" };

export const ANALYTICS_PERIODS: [AnalyticsFilters["period"], string][] = [
  ["all", "All time"],
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["90", "Last 90 days"],
  ["365", "Last 12 months"],
  ["custom", "Custom range"],
];

const localDate = (date: Date) => parseLocalDateAndTime(date).date;

/** The from/to pair a period stands for; null when it is all-time or an incomplete custom range. */
export function periodRange(filters: AnalyticsFilters, now = new Date()): { from: string; to: string } | null {
  if (filters.period === "all") return null;
  if (filters.period === "custom") return filters.from && filters.to ? { from: filters.from, to: filters.to } : null;
  return { from: localDate(new Date(now.getTime() - (Number(filters.period) - 1) * DAY_MS)), to: localDate(now) };
}

/** True when any filter the chart takes differs from its default. */
export function isFiltered(chart: AnalyticsChartId, filters: AnalyticsFilters): boolean {
  return ANALYTICS_CHART_FILTERS[chart].some((key) => filters[key] !== NO_ANALYTICS_FILTERS[key]);
}

/** Query string for one chart, carrying only the filters it takes. */
export function analyticsChartQuery(chart: AnalyticsChartId, filters: AnalyticsFilters, now = new Date()): string {
  const params = new URLSearchParams({ chart });
  const range = periodRange(filters, now);
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  for (const key of ["role", "gradeLevel", "subject"] as const) {
    if (filters[key] && chartTakes(chart, key)) params.set(key, filters[key]);
  }
  return params.toString();
}
