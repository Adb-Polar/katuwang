# Plan — UI, General, Tutor, Learner & Admin Improvements

## Status

**Implemented 2026-11-24 — see Changes.md Part 84.** All ten phases are done and verified (917 tests, typecheck,
browser pass in light and dark). The migration was applied to a local scratch database only; apply it to the real
database before deploying. Deviations from the plan as written:
- Questions/options are shuffled when an attempt is *served*, not by rewriting stored positions (keeps the pre/post
  comparison intact).
- "Already selected dates disabled": native date/time inputs cannot grey out individual slots, so past dates are
  disabled and a taken slot shows an inline error and disables submit instead.
- The "Report this learner" button is on the learner's detail page (`/tutor/students/[id]`), not on each roster row.
- `toLearnerClassDTO` was left gated — tutor grade/section are shown on the tutor profile and Find Tutors.
- A real Google sign-in could not be exercised without OAuth credentials.

## Context

A batch of ~30 UX, integrity and admin requests. Exploration showed several are bigger than they read:

- No toast system exists; ~15 mutating actions give **no** success feedback (they only `router.refresh()`/redirect).
- The app is single-theme, light-only (an earlier plan made that a rule — this supersedes it).
- Learner enrollment has **no** schedule-conflict check at all (so the "name the conflicting class" item means building the check).
- No super admin concept, no contact-admin feature, no tutor→learner reports, no timers, no Google provider.
- Analytics API takes no parameters (30 days hard-coded).

Decisions already confirmed with you: **`isSuperAdmin` flag on User**, **Google sign-in for existing accounts only**, **admin-editable email-domain allowlist**, **in-app contact form + admin inbox**.

Assumptions I am making (say so if wrong):
- Enrollment with a schedule conflict is **blocked** (409), not just warned.
- Tutor **grade level + section** are shown to learners always (not names) — consistent with tutors already seeing learners' grade/section.
- Randomization applies to both PRE and POST session tests and to option order in the certification quiz.
- "Overview" rename is for learner/tutor; the merged admin page stays "Dashboard".

## Database changes (one migration, needs your confirmation before running)

All 3NF; nothing derived is stored.

| Change | For |
|---|---|
| `User.isSuperAdmin Boolean @default(false)` | audit-log restriction |
| `SessionTest.timeLimitMinutes Int?` (null = untimed) | quiz duration |
| `ReportTargetType` + `LEARNER`; `Report.reportedLearnerId String?` → User | tutor reports learner |
| New `ContactMessage` (id, name, email, userId?, category, message, status `OPEN/RESOLVED`, adminNote?, resolvedById?, resolvedAt?, createdAt) + `ContactMessageStatus` enum | contact admin |

No schema change needed for: start/end time (keep `ClassSession.duration`, compute from the two times), option shuffle (deterministic seeded shuffle keyed on attempt-item id), certification-quiz time limit and email allowlist (both go in the existing key/value `PlatformSetting`, read via `src/lib/settings.ts`).

Seed: mark `ADM-0001` super admin; add default `allowedEmailDomains`.

## Phases

Each phase is independently shippable: write tests first, then `pnpm exec tsc --noEmit && pnpm lint && pnpm test`, add a `Changes.md` Part and `docs/backlog/TOTEST.txt` lines. No commits/pushes unless you say so.

### Phase 1 — Shared foundations (no behaviour change)
- **Toast**: `src/components/ui/Toast.tsx` — `ToastProvider` + `useToast()` built on DaisyUI `toast`/`alert` (no new dependency), mounted in `src/components/providers/` at the root so toasts survive `router.push`. `role="status"`, auto-dismiss 4s.
- **Pure overlap helper**: extract `rangesOverlap()` / `findOverlap()` from `src/lib/classSessions.ts` (currently inline in `hasSessionOverlap`) so client and server share it.
- **Seeded shuffle**: export `shuffle` from `src/lib/assessmentPicker.ts` and add `seededShuffle(items, seed)`.

### Phase 2 — UI shell
- Rename nav label + page metadata/eyebrow "Dashboard" → **Overview** in `src/app/learner/layout.tsx`, `src/app/tutor/layout.tsx`, and both `page.tsx`.
- Remove the **Profile** nav item from learner/tutor arrays; avatar in `src/components/layout/PortalLayout.tsx` already links via `profileHref`. Add `/admin/profile` (move the "My Account" change-password card out of `src/app/admin/settings/page.tsx`) and pass `profileHref` in the admin layout. Add tooltip/`title` so the avatar is discoverable.
- **Asterisks**: move raw-label forms onto `src/components/ui/FormField.tsx` `required` — `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `PromptDialog`; sweep remaining forms for required inputs missing the prop.
- **Feedback audit**: add `toast.success(...)` to every silent mutation — `NewClassForm`, `EditClassForm`, `AddSessionModal`, `SessionActions`, `ClassManageMenu` (also swap its raw error span for `FeedbackBanner`), `ClassAppealCard`, `AcceptRequestForm`, `LearnerClassActions` (enroll/drop), `RequestTopicButton`, `TopicRequestManager` cancel, `SessionTestBuilder` create, `TopicCertificationList`, `useTopicCertifications`. Existing inline success banners stay; errors stay inline next to the form.

### Phase 3 — Dark mode
- Add a second `@plugin "daisyui/theme"` block (`katuwang dark`, `color-scheme: dark`) in `src/app/globals.css`; rework literal `--kt-*` tokens (`--kt-tutor-text`, `--kt-warning-text`, black shadows) into per-theme values.
- `ThemeToggle` (sun/moon, Lucide) in the PortalLayout top bar, `AuthLayout` and landing nav; persisted in `localStorage`, applied by a tiny inline script in `src/app/layout.tsx` `<head>` to avoid a flash; defaults to system preference.
- Fix the few hardcoded spots: `bg-black/40` drawer backdrop, `src/components/landing/Logo.tsx`, and make `src/components/charts/useThemeColors.ts` re-read on `data-theme` change (MutationObserver) so Recharts recolors.
- Log in `decisions.md` (supersedes "light only" in `docs/plans/landing-page-redesign.md`).

### Phase 4 — Tutor scheduling
- **Start/end time**: in `ClassScheduleFields.tsx`, `AddSessionModal.tsx`, `SessionActions.tsx` (reschedule) replace `datetime-local` + duration select with date + start time + end time, plus a read-only "Duration: 1h 30m" line. Client derives `duration` and still sends `{scheduledAt, duration}` — API, Zod (`src/lib/validations/class.ts`, 15–240 min) and DB unchanged. Inline error if end ≤ start or outside 15–240.
- **Instant validation**: new `GET /api/tutor/sessions/busy` (tutor's upcoming SCHEDULED sessions: start, duration, class code). Forms get `min` = today, show "Already booked that day: 9:00–10:00 (C-0012)" under the row, flag overlaps (against busy slots and other rows) immediately via `findOverlap`, and disable submit while invalid. Server checks remain as the authority.

### Phase 5 — Learner
- **Enrollment conflict**: `findLearnerScheduleConflict(learnerId, classId)` in `src/lib/classSessions.ts`; `src/app/api/classes/[classId]/enroll/route.ts` returns 409 `"Schedule conflict with C-0007 (Mathematics) on Nov 30, 9:00–10:00 AM."` Shown by existing `FeedbackBanner` in `LearnerClassActions`. Update `docs/roles/LEARNER.md`.
- **Tutor info**: `src/app/learner/tutors/[tutorId]/page.tsx` and `src/app/api/learner/tutors/route.ts` + `toLearnerClassDTO` (`src/lib/classQueries.ts`) select `gradeLevel` + `section` un-gated; show a "Tutor details" card (anonymous ID, grade, section, verified topic count, classes taught). Names stay gated on `showTutorRealNames`. Log in `decisions.md`.

### Phase 6 — Run the migration (after your confirmation), regenerate client, update seed, `docs/reference/erd.*`.

### Phase 7 — Assessments
- **Randomize**: in `.../test/[kind]/start/route.ts` shuffle item `position` per attempt; in `sessionTestSerialize.ts` and `assessmentSerialize.ts` order options with `seededShuffle(options, item.id)` (stable across resume, different per learner). Verify pre/post comparison joins on `questionId`, not `position`; fix if not. Update `decisions.md` (reverses "ordered rows").
- **Duration**: `timeLimitMinutes` field in `SessionTestBuilder` + `src/lib/validations/sessionTest.ts`; `assessmentTimeLimitMinutes` in the admin assessment config. Serializers return `deadlineAt = startedAt + limit`. Runners show a countdown and auto-submit at zero; submit routes accept up to deadline + 30s grace, after that the attempt is graded with unanswered = wrong (existing `gradeAttempt`).
- **No copy**: `select-none` + `onCopy/onCut/onContextMenu` preventDefault on the in-progress view of `SessionTestRunner` and `AssessmentQuizRunner` (not the graded review). A deterrent, not real protection.

### Phase 8 — Auth & accounts
- **Email allowlist**: `allowedEmailDomains` setting (editable in `PlatformSettingsForm`); enforced server-side in `src/app/api/register/route.ts` and for `recoveryEmail` in profile routes; `RegisterForm` shows the accepted domains as a hint. Existing accounts are untouched (seed uses `katuwang.test` — add it to the dev default).
- **Google login**: `GoogleProvider` in `src/lib/auth.ts` (ships with next-auth v4), enabled only when `GOOGLE_CLIENT_ID/SECRET` are set. Extract the status checks from `authorize` into `assertCanSignIn(user)` and reuse in a `signIn` callback: require `email_verified`, match an existing user by email, else redirect `/login?error=no-account`. `jwt` callback loads the DB user (id, role, status, isSuperAdmin) for Google sign-ins. "Continue with Google" button in `LoginForm` — same page serves students and admins. Add `.env.example`; update `docs/reference/auth-implementation.md`. You will need to create the OAuth client in Google Cloud and supply the keys.
- **Contact administrator**: public `/contact` page + `POST /api/contact` (Zod, `src/lib/rateLimit.ts`, notifies admins like `REPORT_NEW` does). Linked from login, landing footer, `/unauthorized`, pending/declined pages, and the suspended/banned error. `LoginForm` finally handles `?reason=account-inactive` (proxy sets it; nothing reads it today). Admin inbox `/admin/contact-messages` with resolve + note, audit-logged.
- **Tutor reports learner**: move `ReportButton` to `src/components/reports/` accepting `LEARNER`; `LEARNER_VIOLATIONS` in `src/lib/reportViolations.ts` (reusing existing enum values); `POST/GET /api/tutor/reports` gated on the learner being enrolled in one of the tutor's classes; button on the tutor Students roster; "My Reports" for tutors; `AbuseReportTable` + admin API show the learner target (anonymous ID only).

### Phase 9 — Admin
- **Super admin**: `isSuperAdmin` into JWT/session (`src/types`), `requireSuperAdmin()` helper; `GET /api/admin/audit-log` → 403, page redirects, nav item and `AuditLogLink` hidden, the "last 10 audit entries" block on `admin/users/[id]` hidden for regular admins. `decisions.md` + `docs/roles/ADMIN.md` + feature checklist.
- **Merge dashboard + analytics**: `/admin` = `StatCard` row (existing four + Total Enrollments + Enrollments in range) → "Needs attention" → charts. Remove "Recent activity". `/admin/reports` becomes a redirect; drop the "Reports" nav item.
- **Chart filters**: `GET /api/admin/reports` accepts `from`, `to` (presets 7/30/90 days, this school year, custom), `gradeLevel`, `subject`, validated with Zod; applied to enrollment trend (`enrolledAt`), class charts (`createdAt`, subject, grade) and user charts (`createdAt`, grade). One filter bar in `ReportsView`, state in the URL so it is shareable; CSV export respects filters.

### Phase 10 — Fill blank space (last, once layouts have settled)
- Learner Overview: right column gains "Recommended for you" and a progress snapshot beside Quick links; meaningful empty states with a call to action.
- Tutor Overview: two-column grid — Upcoming sessions (2/3) beside Assessments summary + open requests (1/3).
- Review profile, tutor-detail and short admin pages at 1440px for the same issue.

## Verification

- **Automated** (per phase): new Vitest files following the existing `vi.hoisted` pattern — enroll conflict (409 + message names the class), busy-slots route, tutor reports (403 when not enrolled, 409 duplicate), contact (400/429), audit-log (403 non-super), reports filters (bad range 400), submit after deadline, allowlist (rejects `asa@qwqe`, `a@test.123`), Google `signIn` callback (no account, suspended, banned), `seededShuffle` determinism, `findOverlap`. Then `tsc`, `lint`, full `pnpm test`, `pnpm build`.
- **Browser** (after UI phases): run `pnpm dev` against a seeded DB and drive it with the pre-installed Playwright/Chromium — log in as each seed role, walk every changed flow, screenshot each portal in light and dark, check no horizontal scroll at 375px.
- **Manual** (`TOTEST.txt`): Google sign-in with real keys, timer auto-submit, toast on every action in the audit list, dark-mode chart colours, super admin vs admin audit visibility.

## Risks
- Google login cannot be tested end-to-end without your OAuth credentials; unit tests cover the callback logic.
- The browser pass needs a MariaDB instance in the session; if none is reachable I will say so and rely on tests + your manual pass.
- Dark mode touches every screen — the screenshot sweep is what catches contrast problems.
