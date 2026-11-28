# Per-chart analytics filters (admin dashboard)

Branch: `feat/ui-ux-batch`. Status: implemented (Changes.md Part 104).

## Why

The admin dashboard had one global "Filter the charts" panel (period, user role, grade level,
subject) that drove every chart at once. Admins want to compare charts under different filters,
so each chart gets its own controls, and only the ones that make sense for it.

## Which filters each chart takes

The field a chart groups by is never offered as its filter (filtering "Users by role" by role
would just hide bars).

| Chart | Period | Role | Grade level | Subject |
|---|---|---|---|---|
| Enrollments (4 stat cards + trend) | ✅ | — (not a user breakdown) | ✅ learner's grade | ✅ class subject |
| Users by role | ✅ | — | ✅ | — |
| Users by grade level | ✅ | ✅ | — | — |
| Users by status | ✅ | ✅ | ✅ | — |
| Classes by subject | ✅ | — | ✅ | — |
| Classes by status | ✅ | — | ✅ | ✅ |
| Certifications by status | ✅ | — | ✅ tutor's grade | ✅ |

The table lives in code as `ANALYTICS_CHART_FILTERS` (`src/lib/analyticsCharts.ts`), shared by
the API and the UI.

## Approach

- `GET /api/admin/reports?chart=<id>&from=&to=&role=&gradeLevel=&subject=` — `chart` is now
  required and the route runs only that chart's queries. Filters a chart does not take are
  ignored. Breakdowns return `{ chart, rows }`; `enrollments` returns `{ chart, enrollments }`.
  Charts that take a subject also return `subjectOptions`.
- Rejected alternative: one request returning every chart with per-chart prefixed params — harder
  to keep correct and refetches everything when one chart changes.
- UI: `ReportsView` drops the global panel. `AnalyticsFilters` renders a compact filter row for a
  chart; `useAnalyticsChart` owns one chart's fetch. `BreakdownChartCard` wraps `BarChartCard`
  (which gains a `toolbar` slot); `EnrollmentAnalytics` holds the stat cards and trend.
- Each chart has its own Clear button and keeps showing its last data while refetching.

## Tests

- `src/app/api/admin/reports/__tests__/route.test.ts` — rewritten per chart: auth, unknown/missing
  chart (400), filter applicability, date ranges, enrolment bucketing, subject options.
- `src/lib/__tests__/analyticsCharts.test.ts` — query building only sends applicable filters.
