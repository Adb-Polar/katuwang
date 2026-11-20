# Report Generation — all 3 portals (PDF + CSV)

> **Status: DONE (2026-11-19, Changes.md Part 91).** Shipped as planned, with these adjustments:
> - Only the learner progress query moved into a shared helper (`src/lib/progress/learner.ts`). The tutor and admin reports need date filters, per-learner rows and pre/post counts that the existing roll-up and `/api/admin/reports` don't have, so `src/lib/reports/{tutor,admin}.ts` query directly and the existing routes are unchanged.
> - A tutor asking for someone else's class gets the existing `loadOwnedClass` status (403 for a class they don't own, 404 for a missing one), not a blanket 404.
> - CSV adds a UTF-8 BOM and a CSV-injection guard; admin exports are capped at 5,000 rows with a note.

## Context
Only `/admin/reports` can export today (a client-side CSV of aggregate counts). Learners and tutors can see pre/post progress on screen but cannot download or print it. Thesis L1441–1451 calls for "Learner Progress Reporting" and "Privacy-Safe Reporting". This plan adds on-demand downloadable reports (PDF + CSV), with date-range filters, to every portal.

Decisions (confirmed with user):
- Formats: **PDF** (server-side pdf-lib) and **CSV** (server-side `toCsv`).
- Reports: learner progress, tutor class report, admin platform report. All take an optional `from`/`to` date range.
- Generated on demand. **No schema change and no migration.**

First execution step: copy this plan to `docs/plans/report-generation.md`, as CLAUDE.md requires.

## Architecture
One endpoint per portal: `GET …/report?format=pdf|csv&from=YYYY-MM-DD&to=YYYY-MM-DD[&scope]`.
1. A pure **data builder** (`src/lib/reports/<portal>.ts`) queries Prisma and returns a typed `ReportModel`: title, meta lines, summary KPIs, and sections. Each section has columns and rows.
2. A **renderer** turns that model into a PDF or a CSV. Each builder is written once and works with both formats.
3. The route checks auth, validates the query with Zod, builds the model, renders it and streams the file. Responses use the certificate-download headers (`attachment`, `private, no-store`, `nosniff`).

### New shared lib — `src/lib/reports/`
- `types.ts`: `ReportModel`, `ReportSection`, `ReportColumn`.
- `range.ts`: parses `from`/`to` as Philippine dates (+08:00, same as `api/admin/reports`). Defaults to the last 90 days and caps a range at 1 year.
- `pdf.ts`: `renderReportPdf(model)`. A4 portrait with a header (logo and title), meta lines, a KPI row and paginated tables (header row repeated on each page, long cells wrapped or truncated), plus a footer with "Generated <date> · page X of Y". Reuses the font/logo loading in `src/lib/certificates/pdf.ts`; move `loadAssets` into a shared `src/lib/pdf/assets.ts` so both files use it.
- `csv.ts`: `renderReportCsv(model)`. Flattens sections into one CSV with a `section` column, reusing `toCsv` from `src/lib/csv.ts`.
- `respond.ts`: `reportResponse(bytes, filename, format)` builds the download headers.
- `src/lib/validations/reports.ts`: Zod schema `{ format: enum, from?, to?, classId?, scope? }`.

## Reports

### 1. Learner — "My Progress Report"
- Route: `src/app/api/learner/report/route.ts` (STUDENT_LEARNER; optional `classId`).
- Builder: `src/lib/reports/learner.ts`. Reuses the series and summary logic from `src/app/api/learner/progress/route.ts`; move it into `src/lib/progress/learner.ts` so the existing route and the report share it.
- Contents: identity (the learner's own anonymousId, grade and section); summary (classes enrolled, completed and withdrawn, sessions tested, average pre, post and gain); a per-session table (class code, subject, topic, date, pre, post, Δ); certificates earned (number, class code, date).
- **Double-blind:** no tutor identity and no class or cohort averages, same as the progress route.
- UI: a `ReportDownloadButtons` component (date range plus PDF and CSV buttons) on `MyProgressView.tsx`.

### 2. Tutor — "Class Report" and "Tutoring Summary"
- Route: `src/app/api/tutor/report/route.ts` (STUDENT_TUTOR).
  - `scope=class&classId=…`: checks the class belongs to the tutor (404 if not).
  - `scope=summary`: covers all of the tutor's classes.
- Builder: `src/lib/reports/tutor.ts`. Reuses the aggregation in `api/tutor/classes/[classId]/test-results/route.ts`; move it into a lib helper.
- Class report: class info; sessions (topic, date, status, test status, number of PRE and POST attempts, average pre, post and Δ); roster **by learner anonymousId only** (enrolled date, withdrawn, per-learner average pre and post).
- Summary report: classes by status, sessions held, learners reached, average gain per class, and qualification history (AssessmentAttempt: subject, topic, score, passed) with certified topics.
- UI: buttons in `ClassProgressPanel.tsx` (class report) and on the tutor dashboard or assessments page (summary).

### 3. Admin — "Platform Report" and data exports
- Route: `src/app/api/admin/report/route.ts` (ADMIN), with `scope=overview|users|classes|enrollments|session-tests|certifications|audit-log`.
- Builder: `src/lib/reports/admin.ts`. `overview` reuses the counts from `api/admin/reports/route.ts`; move them into a lib helper. Every scope is filtered by date range.
- Admins may see real names (existing rule). Exports apply `showTutorRealNames` only where it already applies.
- UI: in `ReportsView.tsx`, replace the client-side CSV-only export with `ReportDownloadButtons` plus a scope selector.

### Shared UI — `src/components/reports/ReportDownloadButtons.tsx`
A client component built with DaisyUI (`join`, date inputs, `btn btn-sm`). It takes `endpoint` and `extraParams` props, downloads the file with `fetch` → blob, shows a loading state, and shows any `{error}` in an `alert`.

## Tests (Vitest, `vi.hoisted` Prisma mock, mocked session)
- `src/lib/reports/__tests__/range.test.ts`: defaults, the PH timezone, the 1-year cap, `from > to` → error.
- `src/lib/reports/__tests__/csv.test.ts` and `pdf.test.ts`: the CSV renders all sections; the PDF has the `%PDF` header and paginates more than 60 rows.
- One `__tests__/route.test.ts` per report route: 401 for a wrong role or no session; 400 for a bad format or range; 404 when a tutor requests a class they don't own; 200 with the right `Content-Type` and `Content-Disposition`; 500 resilience. **Anonymity check:** learner and tutor outputs never include `firstName`, `lastName` or `email`. Assert the Prisma `select` shape and the rendered CSV text.
- The existing progress, test-results and admin-reports route tests must still pass after the logic moves into lib helpers.

## Docs
- `docs/plans/report-generation.md` (this plan).
- `Changes.md` entry.
- `docs/roles/{LEARNER,TUTOR,ADMIN}.md`: the new endpoints and buttons.
- `docs/reference/feature-checklist.md`: add "Report generation (PDF/CSV)" to §6 Analytics.
- `docs/reference/decisions.md`: on-demand only (no stored reports), and peer reports exclude cohort averages.
- `docs/backlog/TOTEST.txt`: `[ ]` lines for each portal's PDF and CSV download, date filter, tutor non-owned class → 404, and opening the PDF in a viewer.

## Step order
1. Shared lib: pdf assets move, `reports/*`, validation, plus tests.
2. Move existing aggregations into lib helpers (no behaviour change; existing tests stay green).
3. Learner route, builder and UI. 4. Tutor. 5. Admin.
6. Docs, Changes.md, TOTEST.

## Verification
- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.
- `pnpm dev`: use `/dev` quick-login as each role (seed data via the dev data factory), download PDF and CSV for each report, open the PDF, and check pagination, the date filter and that learner/tutor files contain no real names.
- Do not commit until the user confirms (CLAUDE.md).

## Open item to flag (not in scope)
`CompletionCertificate` stores the tutor's real name, so a learner's certificate PDF may show it. That may break the double-blind rule. The learner report lists certificates by number only and will not print `tutorName`.
