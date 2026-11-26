# UI/UX batch — implementation plan

## Context

A backlog of ~28 UI, validation and feature items across all portals (rename Dashboard, dark mode,
action feedback, assessment hardening, contact admin, tutor→learner reports, admin analytics merge,
etc.). The work starts from `27f99ff` (tip of `origin/feat/request-queue`, Changes.md Part 97,
1518 tests) on a new branch **`feat/ui-ux-batch`**.

Decisions already made with the user:
- **Google sign-in: deferred** (both the General and Admin items). Not in this plan.
- **Super admin**: the `SUPER_ADMIN` role already exists on this base (`src/lib/permissions.ts`), so
  no flag or schema change is needed for audit-log gating.
- **Email**: strict format + admin-managed domain allowlist.
- **Contact admin**: public in-app form, stored in DB, admin inbox.
- **Tutor profile**: always show section + grade level (deliberate anonymity relaxation → decisions.md).

Caveat: exploration ran on the older `main` tree; key facts were re-verified against `27f99ff`, but
line numbers were not. Each phase starts by re-reading its files on the branch.

## Ground rules (CLAUDE.md)

- No commit or push without being told; ask for confirmation before committing. Pushing
  `feat/ui-ux-batch` needs explicit go-ahead (it is not the session's designated branch).
- Schema changes (Phases 5, 6, 7) need DB-modification confirmation before `prisma migrate`.
- Every phase: add a `Changes.md` part (98+), add `[ ]` lines to `docs/backlog/TOTEST.txt`, update
  `docs/roles/*.md`; decisions → `docs/reference/decisions.md` + `feature-checklist.md`.
- Copy this plan to `docs/plans/ui-ux-batch.md` and add a row to `docs/plans/README.md` (Phase 0).
- TDD per phase: write/extend the route or component test first, then implement.

## Phase 0 — Setup

1. `git checkout -b feat/ui-ux-batch 27f99ff`; `pnpm install`; `npx prisma generate`.
2. Baseline: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` — record the passing count.
3. Write `docs/plans/ui-ux-batch.md`; index it in `docs/plans/README.md`.

## Phase 1 — Shared UI foundations (no schema)

**1a. Toast system** — new `src/components/ui/Toast.tsx` (`ToastProvider` + `useToast()`, DaisyUI
`toast` + `alert`, `role="status"`, auto-dismiss) mounted in `src/app/layout.tsx`. For actions that
navigate away, a `?toast=` query or sessionStorage "flash" read by the provider on mount.
Wire into every silent mutation found in the audit (keep existing `FeedbackBanner` usages):
- Tutor: `NewClassForm`, `EditClassForm`, `AcceptRequestForm`, `AddSessionModal`,
  `SessionActions`, `ClassManageMenu`, `ClassAppealCard`, `SessionTestBuilder` (create, write
  question), `TopicCertificationList`, `hooks/useTopicCertifications`.
- Learner: `LearnerClassActions` (enroll/unenroll), `RequestTopicButton`.
- Re-audit on the branch for components added since Part 83 (certificates, admins, uploads) with
  `grep -rn 'method: "(POST|PATCH|PUT|DELETE)"' src/components src/hooks`.

**1b. Required asterisks** — `FormField` already renders `*` when `required`. Add `required` where
missing (`OtherTopicAssessment`, location/meeting-link "one of two" → hint stays) and convert raw
labels to `FormField` or add the same asterisk span: `LoginForm`, `ForgotPasswordForm`,
`ResetPasswordForm`, `PromptDialog`, `PlatformSettingsForm`, quiz/test-builder labels. Check
`ValidatedForm` for a single place to enforce this.

**1c. Rename + nav** — `src/app/learner/layout.tsx`, `src/app/tutor/layout.tsx`: label
"Dashboard" → "Overview"; remove the "Profile" nav entry (avatar already links via `profileHref` in
`PortalLayout.tsx`). Give admin a `profileHref` too (→ `/admin/settings`, where the password form
lives). Update "Go to Dashboard"/"portal dashboard" copy, chatbot intent links
(`src/lib/chatbot/intents.ts`), and the two `page.test.tsx` files.

**1d. Dark mode** — `src/app/globals.css`: add a second `@plugin "daisyui/theme"` block
`katuwang-dark` (`color-scheme: dark`, OKLCH tokens mirroring the light palette); make the fixed
`--kt-*` values (`--kt-tutor-text`, `--kt-warning-text`, shadows) theme-scoped. New
`src/components/ui/ThemeToggle.tsx` in the `PortalLayout` top bar: sets `data-theme` on `<html>`,
persists to localStorage, inline pre-hydration script in `layout.tsx` to avoid flash. Public pages
stay light (`PublicShell` already pins `data-theme="katuwang-public"`). Make
`charts/useThemeColors.ts` re-read CSS vars on theme change (MutationObserver on `data-theme`).

**1e. Fill blank space** — `src/app/tutor/page.tsx`: two-column grid (`lg:grid-cols-3`), sessions +
timetable in the main column; Getting Started, `AssessmentsSummaryCard`, quick links in a side
column. `src/app/learner/page.tsx`: grow the quick-links column (recommended classes / pending
requests / latest test result). Profile edit: drop the `max-w-2xl` cap in favour of a 2-column grid.

## Phase 2 — Validation & scheduling UX (no schema)

**2a. Email rule** — new `src/lib/validations/email.ts`: shared `emailField()` (strict format: real
TLD of 2+ letters, no numeric TLD) replacing the inline chains in `validations/{auth,admin,
emailVerification,passwordReset,profile}.ts`. Allowlist: string-valued `PlatformSetting` key
`allowedEmailDomains` (pattern: the numeric assessment settings in `src/lib/settings.ts`), enforced
server-side in `src/app/api/register/route.ts` and admin creation
(`src/app/api/admin/admins/route.ts`); editor in `PlatformSettingsForm`. Empty list = any domain.
Existing accounts are not affected. Seed/dev domains (`katuwang.test`, `dev.test`) stay valid.

**2b. Start/end time** — `src/components/tutor/SessionFormFields.tsx` and
`ClassScheduleFields.tsx`: replace the duration select with start + end `type="time"`; show computed
duration read-only; still submit `{scheduledAt, duration}` so API, schema and stored data are
unchanged. Client check: end > start, 15–240 min (matches `validations/class.ts`). Covers
`AddSessionModal` and `SessionActions` through the shared fields.

**2c. Disable invalid dates up front** — date input `min={today}`; server page
`src/app/tutor/classes/new/page.tsx` (and the modal parents) prefetch the tutor's SCHEDULED
sessions and pass them down; the form flags a row inline the moment its range overlaps an existing
session or another row (reuse the overlap maths from `src/lib/classSessions.ts` — extract a pure
`rangesOverlap` helper) and disables submit. Server checks stay as the source of truth.

**2d. Conflict message names the class** — change `hasLearnerSessionOverlap` in
`src/lib/classSessions.ts` to return the first conflicting `{subject, code, scheduledAt}` (or
null); `src/app/api/classes/[classId]/enroll/route.ts` builds
"Schedule conflict with <Subject> · <CODE> on <date, time>." Update the enroll route test.

## Phase 3 — Admin

- **Audit log → super admin only**: `requireSuperAdminSession()` in
  `src/app/api/admin/audit-log/route.ts`; `proxy.ts` guard for `/admin/audit-log` (same pattern as
  `/admin/admins`); move the nav item into the super-admin-only block in `src/app/admin/layout.tsx`;
  hide `AuditLogLink` for plain admins.
- **Merge dashboard + analytics**: `/admin` renders stat cards + "Needs attention" + the analytics
  charts (`ReportsView`); remove "Recent activity" and its `auditLog.findMany`; `/admin/reports`
  redirects to `/admin`; drop the "Analytics" nav entry. Export controls move with the charts.
- **Cards at top**: replace the DaisyUI `stats` block in `ReportsView` with `StatCard`s.
- **Chart filters**: `GET /api/admin/reports` accepts `from`, `to` (default last 30 days, max 365),
  `role`, `gradeLevel`, `subject`; Zod-validated. Filter bar (date range presets 7/30/90 days +
  custom, selects) above the charts; state in the URL query. Keep the route inside its
  request-queue lane (`src/lib/requestQueue.ts`).

## Phase 4 — Assessments (schema: one column)

- **Randomize post-test**: in `src/lib/sessionTestSerialize.ts`, shuffle question order and option
  order with a deterministic PRNG seeded by `attemptId` when `kind === "POST"` and the attempt is in
  progress. Stored `position` values are untouched, so pre/post comparison and grading (by
  question/option id) are unaffected and a resumed attempt sees the same order.
- **Disable copy**: `SessionTestRunner` and `AssessmentQuizRunner` — `select-none` plus
  `onCopy`/`onCut`/`onContextMenu` preventDefault on the question area (deterrent only; noted as
  such in docs).
- **Duration**: add `SessionTest.durationMinutes Int?` (null = untimed) set in `SessionTestBuilder`;
  certification quiz duration as a numeric platform setting. Server enforces: deadline =
  `startedAt + duration`; submit route accepts within a short grace window, otherwise grades what
  was saved; runner shows a countdown and auto-submits at zero. Snapshot the duration on the
  attempt row so later edits don't change a running attempt (`durationMinutes Int?` on
  `SessionTestAttempt` / `AssessmentAttempt`).

## Phase 5 — Tutor reports learner (schema)

- Schema: `ReportTargetType += LEARNER`; `Report.reportedLearnerId String?` → `User`
  (`"ReportsAgainst"`); learner-conduct values in `ReportViolationType`.
- `src/lib/reportViolations.ts`: `LEARNER_VIOLATIONS`. `validations/report.ts`: allow `LEARNER`.
- New `src/app/api/tutor/reports/route.ts` (GET own, POST) — tutor must have the learner enrolled in
  one of their classes; no duplicate pending report; notifies admins.
- Move `ReportButton` to `src/components/reports/` with an `endpoint` prop; add it to
  `src/app/tutor/students/[studentId]/page.tsx`; new `/tutor/reports` list page + nav entry.
- Admin: `AbuseReportTable` + `api/admin/abuse-reports` handle tutor reporters / learner targets;
  reviewer notification link chosen by reporter role. Double-blind: tutor sees only `STU-XXXX`.

## Phase 6 — Contact administrator (schema)

- New model `ContactMessage` (name, email, accountEmail?, category, message, status, handledById,
  timestamps). `POST /api/contact` public, Zod-validated, rate-limited per IP (existing limiter),
  placed in a request-queue lane.
- Public `/contact` page (PublicShell). Links from: login page, suspended/banned errors in
  `LoginForm`, `/unauthorized`, `/account-declined`, `/pending-approval`.
- Fix found on the way: `LoginForm` ignores `?reason=account-inactive` from `proxy.ts` — show a
  banner with the contact link.
- Admin inbox `/admin/contact-messages` (list, mark handled, audit-logged) + notification.

## Phase 7 — Tutor profile for learners

`src/app/learner/tutors/[tutorId]/page.tsx`: always show grade level, section, certified subjects,
class count, completed sessions, member-since; real name stays behind `showTutorRealNames`. Stop
selecting `firstName`/`lastName` when the setting is off. Mirror section in
`api/learner/tutors` + `TutorBrowser`. Log the relaxation in `decisions.md`; update `LEARNER.md`.

## Verification

Per phase, before asking to commit:
1. `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` (no skipped tests; count ≥ baseline + new).
2. New/updated tests: route tests for enroll conflict text, audit-log 403 for ADMIN, reports
   filters, tutor reports, contact, email allowlist, timed submit; unit tests for the seeded
   shuffle, `rangesOverlap`, `emailField`; component tests (existing jsdom `.test.tsx` pattern) for
   `ClassScheduleFields`, `SessionTestRunner`, toast provider, `ProfileView`.
3. In-app check with the pre-installed Playwright against `pnpm dev` + seeded DB
   (`prisma/SEED_ACCOUNTS.md`), light and dark, desktop and phone width, one script per role:
   - Tutor: create class (start/end → duration shown, past date blocked, overlap flagged before
     submit, success toast); report a learner; Overview layout.
   - Learner: enroll into an overlapping class → message names the class; tutor profile fields;
     timed post-test with shuffled order, copy blocked, auto-submit.
   - Admin vs super admin: audit log hidden/403 vs visible; merged dashboard, filters change charts.
   - Logged out: `/contact` submit → appears in admin inbox; bad-domain registration rejected.
4. Each scenario also goes into `docs/backlog/TOTEST.txt` as a `[ ]` line.

If the dev DB is not reachable from this cloud session, step 3 is blocked: report that, finish
steps 1–2, and leave the TOTEST lines for manual verification.

## Out of scope

Google sign-in (deferred by the user).

---

## Follow-up (approved 2026-11-26): remaining schema phases

Phases 1–4 (no-schema parts) and 7 shipped as Changes.md Part 98. Still to do, each with its
own migration, applied to the local database only (the cloud database is the owner's to migrate
with `pnpm db:deploy`):

- **Phase A — Assessment duration (Part 99).** `timeLimitMinutes` on `SessionTest`,
  `SessionTestAttempt` and `AssessmentAttempt` (snapshot at start); certification limit as the
  `assessmentTimeLimitMinutes` setting; countdown and auto-submit in both runners; late
  submissions are graded, not rejected.
- **Phase B — Tutor reports learner (Part 100).** `ReportTargetType.LEARNER`,
  `Report.reportedLearnerId`, learner-conduct violation types; `POST/GET /api/tutor/reports`;
  report button on the tutor's student page; `/tutor/reports`; admin table support.
- **Phase C — Contact administrator (Part 101).** `ContactMessage` table; public `/contact`
  form (rate-limited); admin inbox; links from login and the account-status pages.

Google sign-in remains deferred.
