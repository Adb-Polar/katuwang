# Sprint Plan — `docs/TODO.txt` Cleanup Sprint

## Context

`docs/TODO.txt` is a flat backlog of ~47 UI/UX and feature gaps collected across the four
portals (General, Learner, Tutor, Admin). Many items are small polish fixes that share the
same underlying components (pagination, `FormField`, `ClassCard`, `SessionsList`), so fixing
them one-by-one would mean touching the same files repeatedly. A handful are real features
that need DB schema changes.

This plan reorganizes the backlog into **13 sequential chunks**, each a self-contained,
PR-sized unit that can be built, reviewed, and shipped on its own. Chunks 1–9 are UI/UX
only (no schema changes). Chunks 10–13 each require a Prisma schema change and **must pause
for explicit DB-change confirmation** before running `prisma migrate` / `db push`, per
`CLAUDE.md`.

Decisions locked with the user:
- **Tutor real names to learners** → gated behind a new `PlatformSetting` key
  `showTutorRealNames` (default `false`), toggled in `/admin/settings`. No schema change.
- **"Contrast on bottom nav bar"** → means the **Anonymous ID container** in the
  `PortalLayout` sidebar/account footer, not a real bottom nav. Just a contrast restyle.
- **Report charts** → add the **`recharts`** package (verify React 19 peer compat).
- **Schema features** → last, in their own chunks, each pausing for confirmation.

After **every** chunk: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` must pass.

---

## Chunk 1 — Shared primitives: URL pagination + form field layout + ID container contrast

**TODO items:** General "Url based pagination", General "contrast on bottom nav bar",
Tutor "label and input doesn't have enough gap", Learner "edit profile form label and input
should be on the same line".

**Goal:** Fix the shared building blocks first so later chunks inherit them.

**Files:**
- `src/hooks/usePaginatedList.ts` — replace internal `useState(1)` page state with
  `useSearchParams()` + `router.replace()` URL sync (`?page=`, `?pageSize=`). Keep the
  same return shape (`page`, `setPage`, `total`, …) so existing callers
  (`UserManagementTable`, `ClassModerationTable`, `StudentRoster`, `TopicRequestQueue`)
  need no change. Preserve the "reset to page 1 when filter params change" behavior; scope
  the query keys per-table via an optional `key` prefix arg to avoid collisions when two
  paginated lists mount on one route.
- `src/components/ui/Pagination.tsx` — add optional `pageSize`, `onPageSizeChange`,
  `pageSizeOptions` props; render a small `select select-xs` ("10 / 25 / 50 / 100 per
  page") when `onPageSizeChange` is provided. Backwards compatible (props optional).
- `src/components/ui/FormField.tsx` — add an `orientation?: "vertical" | "horizontal"`
  prop. `horizontal` renders label + control on one line (`sm:flex sm:items-center
  sm:gap-3`, label `sm:w-40 shrink-0`), hint/error drop below the control. Default stays
  `vertical`. Bump the vertical gap from `gap-1.5` to `gap-2`.
- `src/components/layout/PortalLayout.tsx` — the account-footer "Anonymous ID" box: raise
  contrast (e.g. `bg-base-200` → `bg-base-300` / add `border border-base-content/10`,
  darker label text) in both the desktop sidebar footer and the mobile drawer. Match the
  three accent variants already in `ACCENT_STYLES`.

**Reuse:** `usePaginatedList` is already the pagination abstraction — extend it, don't add a
new one. `Pagination.tsx` stays the only pager component.

**Verification:** Load `/admin/users`, page to 2, refresh → still page 2; change page size →
URL updates, list re-fetches, resets to page 1. `/admin/users` + `/admin/classes` share no
page state. Anonymous ID box is visibly higher-contrast in light theme. No visual change to
any `FormField` that doesn't opt into `horizontal`.

---

## Chunk 2 — Shared class surfaces: ClassCard declutter + unpublished color + session icon tooltips

**TODO items:** Learner "Class Card Fix (Messy and cluttered)", Tutor "Clear class name
currently its all badge cluttered", Tutor "unpublished class color … should be more gray",
Tutor "Session card tooltip icons are unclear without this".

**Goal:** One pass over the shared `src/components/classes/*` visual language.

**Files:**
- `src/components/classes/ClassCard.tsx` — restructure the header: make **subject + grade**
  the visual "title" (larger text, not two competing badges), demote the topic pile to a
  single wrap row with a `+N more` overflow after ~3 topics, keep `StatusBadge` and
  `Unpublished` badge top-right. Tighten the footer icon-facts row spacing. Keep all
  existing props.
- `src/components/classes/classStatus.ts` / `ClassCard.tsx` — unpublished styling: swap the
  `bg-warning/5 … border-warning/30` treatment for a neutral gray
  (`bg-base-200/40 border-base-300 opacity-90`), keep the `Unpublished` + `EyeOff` badge as
  the signal. Apply the same swap in `ClassDetailsView.tsx` and `EditClassForm.tsx`
  wrappers (they currently use `bg-warning/5 p-4`).
- `src/components/classes/SessionsList.tsx` + `src/components/tutor/SessionActions.tsx` —
  give each action icon button a visible affordance: wrap in DaisyUI `tooltip`
  (`className="tooltip" data-tip="Reschedule"` etc.) and/or add a text label at `sm:`
  breakpoint. Keep `aria-label`.

**Reuse:** `ClassCard` is already shared by learner browse, match results, tutor list, tutor
student profile — a single edit covers Learner + Tutor TODO lines.

**Verification:** Learner `/learner/classes` and tutor `/tutor/classes` cards read cleanly
with an obvious title and no badge wall; a class with 6 topics shows `+3 more`. Unpublished
class is gray, not amber. Hovering a session action shows a tooltip naming the action.

---

## Chunk 3 — Tutor class management: sessions in edit form + suspended-class visibility

**TODO items:** Tutor "Add session should only be visible in edit class", Tutor "Session and
add session should be at edit class form", Tutor "classes should still be visible when
suspended and banned … show reason, duration, color change", Tutor "learners enrolled class
should only be visible to the owner of the class".

**Goal:** Consolidate all class-editing (including sessions) into `EditClassForm`, and stop
hiding moderated classes.

**Files:**
- `src/components/tutor/EditClassForm.tsx` — add a "Sessions" card: render `SessionsList`
  with `renderActions={(s) => <SessionActions …/>}` and mount `<AddSessionModal
  classId={…} classTopics={…} />` in that card header. Data: `EditClassForm` already
  receives the class; extend its props / the edit page loader
  (`src/app/tutor/classes/[classId]/edit/page.tsx`) to include `sessions`.
- `src/app/tutor/classes/[classId]/page.tsx` — **remove** `AddSessionModal` from the
  read-only detail page (sessions become edit-only). Keep `SessionsList` read-only there.
- `src/app/tutor/classes/[classId]/edit/page.tsx` — remove the hard
  `alert alert-warning` short-circuit for `SUSPENDED`/`BANNED`. Instead render the form in a
  read-only/locked state **plus** a prominent status panel showing
  `suspendedReason`, `suspendedUntil` (formatted, or "Indefinite"), and an error-tone
  header. Editing controls disabled; sessions read-only.
- `src/components/tutor/ClassManagement.tsx` — keep `SUSPENDED`/`BANNED` classes in the list
  (they already appear via History tab — verify they show in Active too if still within
  `suspendedUntil`); card border/tint switches to an error tone with the reason surfaced
  (reuse the gray/tint pattern from Chunk 2, error variant).
- Enrolled-learners ownership: audit `src/app/api/tutor/classes/[id]/**` and the roster
  fetch — confirm every enrolled-learner read filters by
  `tutorProfileId === session tutorProfile.id` (page-level check exists in
  `classes/[classId]/page.tsx`; make sure no API route leaks a roster without it). Add a
  test.

**Verification:** Editing a class: sessions can be added/edited only from
`/tutor/classes/[id]/edit`. The detail page has no "Add Session". A suspended class still
renders with its reason + "suspended until <date>" and cannot be edited. Hitting a roster
API for a class you don't own returns 403/404 (test).

---

## Chunk 4 — List search/filter parity

**TODO items:** Learner "browse classes no search and filter", Tutor "in student page
student can also be filtered by class add search".

**Files:**
- `src/app/api/classes/route.ts` — extend the learner `scope=browse` branch to accept
  `q` (subject/topic text), `subject`, `gradeLevel` query params (the admin branch already
  does `q`/`subject`/`status` — mirror that logic).
- `src/components/learner/ClassBrowser.tsx` — add a filter bar (search input +
  subject `select` + grade `select`), feed values as params. Migrate from its bespoke
  `useState` + `classBrowserCache` fetch to `usePaginatedList("/api/classes", "classes",
  { scope, q, subject, gradeLevel })` so it gets URL sync from Chunk 1. Keep the 60s cache
  or drop it (cache keys must include the new params if kept).
- `src/components/tutor/StudentRoster.tsx` — add a name/anon-ID search `input` (new `q`
  param) alongside the existing grade/section/subject filters; the "Enrolled In" column
  filter is effectively the existing `subject` select — relabel to "Class / Subject".
- `src/app/api/tutor/students/route.ts` — handle the new `q` param (match `anonymousId`).

**Verification:** `/learner/classes?q=algebra&subject=MATH` filters and the URL is
shareable. Tutor `/tutor/students` search by `STU-0007` narrows to that learner.

---

## Chunk 5 — Learner match + topic requests

**TODO items:** Learner "/learner/match form redesign too small, rename findclass to
automatch, preferred time field too small", Learner "need edit request for student, same
value timefield should be merged", Learner "allow view on topic request, reuse classInfo,
add edit info inside to edit class req", Tutor "topic request card blend in the bg add
border and darker color, request class should be viewed".

**Files:**
- `src/app/tutor/layout.tsx` + `src/app/learner/layout.tsx` nav label + `src/app/learner/
  match/page.tsx` — rename "Find a Class" → **"Auto Match"** (route can stay `/learner/
  match`).
- `src/components/learner/MatchCriteriaFields.tsx` — widen layout (2-col grid on `sm+`),
  enlarge the "Preferred times" slot rows: full-width day select + larger
  `input type="time"` controls, more vertical breathing room. This component is shared by
  `MatchFinder` **and** `TopicRequestManager`, so the redesign lands in both.
- `src/components/learner/MatchFinder.tsx` — roomier form container (drop the cramped
  width), bigger submit, clearer results header.
- **Edit topic request:**
  - `src/app/api/learner/topic-requests/[id]/route.ts` — add `PATCH` handling for editing
    criteria (`subject`, `topics`, `gradeLevel`, `preferredSlots`, `note`) while status is
    `OPEN` (currently PATCH only accepts `status: "CANCELLED"`). Zod-validate with the
    existing criteria schema.
  - `src/components/learner/TopicRequestManager.tsx` — add an "Edit" action on each `OPEN`
    request that reopens the same `MatchCriteriaFields` form pre-filled; on submit, PATCH.
    Merge the duplicate/echoed time fields into the single slot editor.
  - Add a **read view** of a request (reuse the `ClassDetailsView` layout style — the
    "classInfo" the TODO refers to) so a learner can expand a request to see its full
    criteria; embed the Edit form inside that view.
- `src/components/tutor/TopicRequestQueue.tsx` — request cards: add
  `border border-base-300 bg-base-200/50` (currently blends into bg); make the
  "Offer a class" / fulfilled-class reference open a viewable class detail
  (link to a read-only class view or a modal reusing `ClassDetailsView`).

**Verification:** `/learner/match` renders spaciously; time slots are easy to set. A learner
can edit an OPEN request's subject/topics/times/note and see it reflected; a FULFILLED
request cannot be edited. Tutor request cards have a clear border and the offered class is
viewable.

---

## Chunk 6 — Dashboards, learner header, tutor-identity setting

**TODO items:** Learner "Dashboard content", Learner "Header redesign", Tutor "dashboard
content", Admin "dashboard content", Tutor "your assessment card should have a line break on
the tabs", Learner "View tutor profile need name for tutor and section and redesign".

**Files:**
- `src/app/learner/page.tsx` — replace the single "Get Started" card with real content:
  stat tiles (enrolled classes, upcoming sessions this week, open requests), an
  "Upcoming sessions" list, a "My open requests" summary, quick links. Server-fetch via
  `prisma`.
- `src/app/tutor/page.tsx` — add: upcoming sessions across owned classes, enrolled-learner
  count, availability status, and a **suspension/moderation banner** if
  `user.status !== "ACTIVE"` (surface `statusReason` + `statusExpiresAt`). Keep the
  onboarding checklist but collapse it once complete.
- `src/app/admin/page.tsx` — add a recent-activity feed (latest `AuditLog` rows) and
  actionable links (pending certifications count → `/admin/certifications`, flagged
  accounts → filtered `/admin/users`).
- `src/components/layout/PortalLayout.tsx` (or a new `LearnerHeader`) — learner header /
  `PageHeader` usage redesign: tighten the eyebrow/title/subtitle stack, move the
  `AnonymousIdBadge` into a cleaner position. Keep it shared-friendly.
- `src/components/tutor/AssessmentsTabs.tsx` — the `Tabs` for "Your assessment": allow the
  tab labels to wrap / add a line break between the label and the count badge
  (`flex-col` on the tab trigger) so they don't overflow.
- **Tutor identity setting:**
  - `src/components/admin/PlatformSettingsForm.tsx` `SETTING_META` — add
    `showTutorRealNames` → label "Show tutor real names to learners", description warning
    about RA 10173 implications. Default seeded `false` (seed / first-read fallback).
  - `src/app/learner/tutors/[tutorId]/page.tsx` — redesign the page; when
    `getSetting("showTutorRealNames") === "true"`, also select and display the tutor's real
    name + section; otherwise unchanged (anon ID only). Update the subtitle copy
    conditionally.
  - `src/components/learner/TutorInfoTrigger.tsx` / `ClassDetailsView` "TUTOR" cell — show
    the name when the setting is on.

**Verification:** Each dashboard shows useful live data. Suspended tutor sees a banner with
reason + expiry. With `showTutorRealNames` on, learner tutor profile shows the real name +
section; off → only `TUT-XXXX`. Assessment tabs no longer overflow on narrow screens.

---

## Chunk 7 — Profile redesign + admin view surfaces

**TODO items:** General "Profile page redesign", Tutor "profile redesign", Admin
"/admin/users … font too small, add adjustable student number per page, view profile when
clicking users", Admin "/admin/classes classes should be viewable".

**Files:**
- `src/components/profile/ProfileEditForm.tsx` — use `FormField orientation="horizontal"`
  (from Chunk 1) so label + input sit on one line; larger inputs (`input-md`), remove the
  `text-xs` cramping.
- `src/app/learner/profile/page.tsx` + `src/app/tutor/profile/page.tsx` — redesign the
  Account Info + Edit cards: consistent spacing, the read-only rows as a clean definition
  list, `AnonymousIdBadge` prominent. Factor the shared markup into a
  `src/components/profile/ProfileView.tsx` if the two pages diverge only by eyebrow/role
  label (they currently do).
- `src/components/admin/UserManagementTable.tsx` — bump table font from
  `text-2xs`/`text-xs` to `text-sm`; wire the page-size selector from Chunk 1's
  `Pagination` (replace the hard-coded `PAGE_SIZE = 10`); make each row open a user detail
  view.
- **Admin user detail:** new `src/app/admin/users/[id]/page.tsx` (or a `UserDetailModal`) —
  read-only: real name, email, anon ID, role, grade/section, status + reason + expiry,
  enrollment / class / certification counts, recent audit entries for that user. Reuse
  `AnonymousIdBadge`, `StatusBadge`.
- **Admin class detail:** new `src/app/admin/classes/[id]/page.tsx` (or a
  `ClassDetailModal` from `ClassModerationTable`) — reuse `ClassDetailsView` +
  `EnrolledLearnersTable` (read-only) + `SessionsList` (read-only) so an admin sees
  description, sessions, roster, meeting link, moderation history. Row in
  `ClassModerationTable` links here.

**Verification:** Profile pages look intentional, labels inline. `/admin/users` is readable
at `text-sm`, page size adjustable, clicking a row shows full user context. `/admin/classes`
row opens a full class view with sessions + roster.

---

## Chunk 8 — Admin review tooling: certifications, audit log, reports

**TODO items:** Admin "/admin/certification add a tab where accepted and rejected are
listed, add search/filter/sort by, should be paginated", Admin "/admin/audit-log search and
sortby per field", Admin "platform report are cluttered redesign add visual graphs".

> Note: the **Rejected** certification tab depends on the `REJECTED` enum value added in
> **Chunk 10**. This chunk ships the **Pending** + **Accepted (Certified)** tabs, search,
> filters, sort, and pagination; the Rejected tab is added at the end of Chunk 10.

**Files:**
- `src/components/admin/CertificationReviewTable.tsx` — add a `Tabs` control
  (Pending / Certified / [Rejected — Chunk 10]); add search (`q` = tutor anon ID / topic),
  subject filter, sort-by (requested date / certified date / subject), and pagination via
  `usePaginatedList`.
- `src/app/api/admin/certifications/route.ts` — accept `status`, `q`, `subject`, `sort`,
  `page`, `pageSize`; return `{ certifications, total, page, pageSize }`. Currently returns
  a flat pending list only.
- `src/components/admin/AuditLogTable.tsx` — add per-field filters (action `select`,
  target-type `select`, admin anon-ID / reason text search) and clickable sortable column
  headers (Action, Target, Admin, When); paginate.
- `src/app/api/admin/audit-log/route.ts` — accept those filter/sort/pagination params.
- **Reports:**
  - `package.json` — add `recharts` (verify React 19 peer support; pin a compatible
    version). `pnpm install`.
  - `src/components/admin/ReportsView.tsx` — redesign: keep the 2 headline stat tiles, then
    replace the 6 dense `BreakdownTable`s with charts — bar charts for
    Users by Role / Grade / Status and Classes by Subject / Status, a small line/area chart
    for enrollments over time (needs the API to return a time series). Group into a
    responsive card grid; keep a "show data table" disclosure under each chart for
    accessibility.
  - `src/app/api/admin/reports/route.ts` — add an enrollments-by-day (last 30/90d) series.
  - Wrap charts in a small themed wrapper that reads DaisyUI CSS vars for colors so they
    match the OKLCH theme.

**Verification:** `/admin/certifications` filters/sorts/paginates and has Pending +
Certified tabs. `/admin/audit-log` is filterable and sortable per column. `/admin/reports`
shows readable charts that match the theme, with data tables available on demand.

---

## Chunk 9 — Availability: keep or remove (product decision)

**TODO item:** Tutor "is availability still needed?"

**Goal:** Resolve the open question.

**Decision (2026-08-30):** Remove the hand-maintained feature **and** replace it with an
**auto-derived** weekly schedule computed from the tutor's upcoming `SCHEDULED`
`ClassSession` rows. Scheduling sessions *is* how a tutor now signals availability.

**Done:**
- Deleted `src/app/tutor/availability/`, `src/components/tutor/AvailabilityEditor.tsx`,
  `src/app/api/tutor/availability/` (+ its test), and the "Availability" nav entry in
  `src/app/tutor/layout.tsx`. Trimmed `src/lib/validations/availability.ts` to just the
  shared slot schema still used by the matcher.
- New `src/lib/derivedAvailability.ts` (`deriveWeeklyAvailability`): per-session
  `day + start..(start+duration)` windows, overlapping/adjacent windows merged per weekday,
  Monday-first order, past/cancelled/completed ignored. Unit-tested in
  `src/lib/__tests__/derivedAvailability.test.ts`.
- New read-only `src/components/tutor/WeeklyScheduleView.tsx`, rendered as
  "Typical Weekly Schedule" on `/learner/tutors/[tutorId]` and "Your weekly schedule" on the
  tutor dashboard (`/tutor`).
- **Schema (confirmed):** dropped `model Availability` + `TutorProfile.availability`;
  removed `seedAvailability` from `prisma/seed.ts`. Migration:
  `prisma migrate dev --name drop_availability`.
- Match ranking left unchanged — the matcher already scores a class's own sessions against
  the learner's `preferredSlots` (`scheduleFit`), so tutor-availability overlap would be
  redundant.

**Verification:** No dead nav entry / route / model. Tutor with upcoming sessions shows a
merged weekly schedule on their dashboard and their learner-facing profile; a tutor with no
upcoming sessions shows the empty state.

---

# Schema-change chunks (each PAUSES for DB-change confirmation)

Per `CLAUDE.md`: no `prisma migrate` / `db push` / seed writes without explicit
confirmation; tables stay 3NF.

## Chunk 10 — Rejected assessment state

**TODO items:** Tutor "show if the assessment is rejected", Admin certification "rejected"
tab (deferred from Chunk 8).

**Schema:** `prisma/schema.prisma` — add `REJECTED` to `enum TopicCertificationStatus`
(currently `PENDING`, `CERTIFIED`). Optionally add `reviewNote String? @db.Text` and
`reviewedAt DateTime?` to `TopicCertification` for rejection feedback. → **confirm, then
`prisma migrate dev --name topic_certification_rejected`.**

**Code:**
- `src/components/admin/CertificationReviewTable.tsx` — the Reject action currently deletes
  the row; change it to set `status = REJECTED` (+ optional note). Add the **Rejected** tab
  (completes Chunk 8).
- `src/app/api/admin/certifications/route.ts` / `[id]` handler — persist `REJECTED` instead
  of delete; include rejected rows in listings by `status`.
- `src/components/tutor/TopicCertificationList.tsx` + `AssessmentHistory.tsx` +
  `AssessmentsTabs.tsx` — render a "Rejected" state (error-tone `StatusBadge`), show
  `reviewNote`, and allow re-requesting (POST creates/re-opens as `PENDING`).
- `src/app/tutor/assessments/page.tsx` — include rejected certs in
  `certificationDetails`.

**Verification:** Admin rejects a request → tutor sees "Rejected" + reason on the
assessments page and in history; admin Rejected tab lists it; tutor can re-request.

**Status (2026-08-30): DONE — migration `20260830000000_todo_cleanup_ch9_11` applied (with Ch9 + Ch11).**
- Schema: added `REJECTED` to `TopicCertificationStatus`; added `reviewedAt DateTime?` and
  `reviewNote String? @db.Text` to `TopicCertification`. `npx prisma generate` run (codegen
  only), then a hand-authored migration applied via `prisma migrate deploy`.
- `[certificationId]` PATCH: `REJECTED` now `update`s the row (`status`, `reviewedAt`,
  `reviewNote`, `certifiedAt: null`) instead of deleting; audit `reason` = note. `CERTIFIED`
  also stamps `reviewedAt`. `reviewCertificationSchema` accepts optional `reviewNote`.
- `GET /api/admin/certifications`: `?status=REJECTED` works (enum), `sort=reviewed` added,
  REJECTED tab defaults to `reviewedAt desc`.
- `CertificationReviewTable`: Rejected tab (Reviewed date + Note columns), custom reject
  modal with a feedback textarea.
- `POST /api/tutor/topic-certifications`: fetch-first guard — `CERTIFIED` returns `200`
  unchanged; `PENDING`/`REJECTED` reopen as `PENDING` with review fields cleared.
- Tutor UI: `TopicCertificationList` + `AssessmentHistory` render an error-tone "Not Passed"
  badge + reviewer feedback; "Request Again" on rejected rows. `useTopicCertifications`,
  `assessments/page.tsx` carry `reviewedAt`/`reviewNote`.
- Seed: two tutors' pending certs converted to `REJECTED` with notes.
- Tests: cert `[id]` reject test rewritten for update-not-delete (+ null-note case); tutor
  cert POST tests add findUnique mock + re-request/no-downgrade cases; admin cert GET adds
  a `status=REJECTED` ordering test. `tsc` / `lint` / 262 tests green.

## Chunk 11 — Auto-generated class codes (`C-XXXX`)

**TODO item:** Tutor "Classes should also have auto generate code like C-".

**Schema:** `prisma/schema.prisma` — `model TutorClass`: add
`code String @unique`. Add an `IdCounter` row for `"CLASS"`. → **confirm, then migrate**;
backfill existing rows with generated codes in the migration or a one-off script.

**Code:**
- `src/lib/idGenerator.ts` — extend `generateAnonymousId` (or add
  `generateClassCode()`) to support a `"CLASS"` counter → `C-0001` (same atomic
  `idCounter.update` pattern, `padStart(4, "0")`).
- Class creation path (`src/app/api/tutor/classes/route.ts` POST) — generate `code` inside
  the existing create transaction.
- Surface `code` on `ClassCard`, `ClassDetailsView`, tutor class list, admin class table /
  detail (Chunk 7), and make it searchable in the learner browse filter (Chunk 4 `q`) and
  admin class search.
- `prisma/seed.ts` — assign codes to seeded classes.

**Verification:** New class gets a unique `C-XXXX`; visible on cards/detail; searching the
code finds the class; seed + backfill leave no null codes.

**Status (2026-08-30): DONE — see migration `20260830000000_todo_cleanup_ch9_11`.**
- Schema: `TutorClass.code String @unique` added; `IdCounter` comment notes the `"CLASS"`
  role. `npx prisma generate` run (codegen only). **Migration NOT yet run.** Because `code`
  is required + unique, a non-empty DB needs a backfill (`UPDATE tutor_classes SET code =
  CONCAT('C-', LPAD(...))` keyed off a row number) **or** `prisma migrate reset` + reseed.
- `src/lib/idGenerator.ts`: added `generateClassCode()` — atomic `idCounter.upsert` on the
  `"CLASS"` row → `C-0001` (`padStart(4,"0")`). Unit-tested in
  `src/lib/__tests__/idGenerator.test.ts` (also covers `generateAnonymousId`).
- `POST /api/tutor/classes`: generates `code` before the `create` (not a transaction — same
  pattern as `generateAnonymousId` in registration).
- Search: `code` added to the `q` OR in `GET /api/classes` (learner browse) and
  `GET /api/admin/classes`; placeholders updated.
- UI: `code` prop added to `ClassCard` + `ClassDetailsView` (mono eyebrow above the
  subject); passed at every call site (learner browse, match results, tutor list, learner
  tutor-profile; learner/tutor/admin detail pages). `ClassModerationTable` shows it above
  the subject in the row.
- `prisma/seed.ts`: seed-local `nextClassCode()` assigns codes (curated classes first from
  `C-0001`), then the `"CLASS"` `IdCounter` is set to the final count so API-created classes
  continue the sequence.
- Tests updated: tutor classes POST mocks `@/lib/idGenerator`; learner + admin classes
  route tests assert `code` in the search `OR`. `tsc` / `lint` / 267 tests green.

## Chunk 12 — Backup / recovery email + password reset flow

**TODO item:** General "add backup email for recovery".

**Schema:** `prisma/schema.prisma` — `model User`: add `recoveryEmail String?`. New
`model PasswordResetToken { id, userId, tokenHash, expiresAt, usedAt DateTime?, createdAt }`
(3NF, FK to `User`, `@@index([userId])`). → **confirm, then migrate.**

**Code:**
- Registration + profile: let users set/update `recoveryEmail`
  (`src/components/profile/ProfileEditForm.tsx` + `/api/{learner,tutor}/profile`, and the
  register forms/schema `src/lib/validations/auth.ts`).
- Reset flow: `POST /api/auth/forgot-password` (accepts primary or recovery email, creates a
  hashed token, "email sent" response regardless of match), `POST /api/auth/reset-password`
  (validates token, `bcrypt.hash` new password, marks `usedAt`). New pages
  `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`.
- `src/components/auth/LoginForm.tsx` — enable the currently-disabled
  "Forgot password (coming soon)" link → `/forgot-password`.
- Email delivery: wire to whatever mailer exists, or stub with a logged token in dev + a
  `TODO` marker if no mail transport is configured (call this out at implementation).

**Verification:** User sets a recovery email; "forgot password" with either address issues a
token; reset link sets a new password and the token can't be reused; login works with the
new password.

**Status (2026-09-01): DONE — migration `20260831000000_password_recovery` applied.**
- Schema: `User.recoveryEmail String?`; new `model PasswordResetToken`
  (`id, userId → User onDelete Cascade, tokenHash @unique, expiresAt, usedAt?, createdAt`,
  `@@index([userId])`, `@@map("password_reset_tokens")`). Hand-authored migration applied via
  `prisma migrate deploy`; `npx prisma generate` run; no drift.
- `src/lib/passwordReset.ts`: `generateResetToken()` (32-byte hex), `hashResetToken()`
  (SHA-256 — only the hash is stored), `RESET_TOKEN_TTL_MS` = 30 min, `resetTokenExpiry()`.
- `src/lib/validations/passwordReset.ts`: `forgotPasswordSchema` (email, primary or
  recovery), `resetPasswordSchema` (token + password min 8).
- `POST /api/auth/forgot-password`: looks up `email OR recoveryEmail`; for a non-BANNED
  match, invalidates prior unused tokens then creates a new hashed one in a `$transaction`;
  **always** returns the same neutral 200 (no user enumeration). Emails the reset link via
  `sendMail()` / `renderPasswordResetEmail()` from `src/lib/mail.ts`, wrapped in its own
  try/catch so a send failure never breaks the neutral response. (2026-09-03: mailer added —
  see below.)
- `POST /api/auth/reset-password`: validates token by hash, rejects used/expired,
  `bcrypt.hash(pw, 12)`, marks `usedAt` (single-use) in a `$transaction`.
- Pages: `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` (+
  `ForgotPasswordForm`, `ResetPasswordForm`); `LoginForm` "Forgot password?" link enabled →
  `/forgot-password`.
- Profile: `recoveryEmail` accepted by `updateProfileSchema` + learner/tutor profile PATCH.
- Tests: `src/app/api/auth/forgot-password/__tests__/route.test.ts` +
  `.../reset-password/__tests__/route.test.ts` (validation 400, hashed single-use token,
  recovery-email match, neutral no-match, banned skip, used/expired reject, 500). `tsc` /
  `lint` / 279 tests green.
- **Not done:** no rate limiting on `forgot-password`; reset works for SUSPENDED accounts
  (only BANNED excluded).

**Follow-up (2026-09-03): email transport added.** `src/lib/mail.ts` — Nodemailer over
plain SMTP, configured only by env (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_SECURE`, `MAIL_FROM`), transporter cached on `globalThis` like `src/lib/prisma.ts`.
`isMailConfigured()`, `sendMail()` (no-ops with a log line when unconfigured — the old dev
behaviour), `renderPasswordResetEmail()` (minimal HTML + plain-text, no templating deps).
Wired into `forgot-password/route.ts`. Tests: `src/lib/__tests__/mail.test.ts` (7) + 2 new
forgot-password cases (link emailed with the raw token; neutral 200 preserved on send
failure). Docs: relay options (Brevo single-sender / Gmail App Password / Mailpit) in
`README.md`. `tsc` / `lint` / 391 tests green.

## Chunk 13 — User registration approval queue

**TODO item:** Admin "/admin/setting add a user registration approval — when enabled, new
users must be manually approved by an admin before becoming a user; needs a page where admin
approves/declines new users".

**Schema:** `prisma/schema.prisma` — add `PENDING` to `enum AccountStatus`
(`ACTIVE`, `SUSPENDED`, `BANNED`, **`PENDING`**). Reuse existing `statusReason` for a
decline reason. → **confirm, then migrate.**

**Code:**
- `src/components/admin/PlatformSettingsForm.tsx` `SETTING_META` + seed — new key
  `requireRegistrationApproval` (default `false`).
- `src/app/api/register/route.ts` — when the setting is on, create the user with
  `status: "PENDING"` and return a "pending approval" 201 message.
- `src/lib/auth.ts` `authorize` — block `PENDING` accounts at login with a clear
  "awaiting admin approval" error (mirrors the existing SUSPENDED/BANNED handling).
- New `src/app/admin/registrations/page.tsx` + `RegistrationApprovalTable.tsx` — list
  `PENDING` users (name, email, role, grade/section, requested date), Approve → `ACTIVE`,
  Decline → `BANNED` (or delete) with reason; write an `AuditLog` entry
  (`action: "USER_APPROVED" | "USER_DECLINED"`). Paginated (Chunk 1), searchable.
- Add nav entry in `src/app/admin/layout.tsx`; badge the count on the admin dashboard
  (Chunk 6).

**Verification:** With the toggle on, a new registration cannot log in ("awaiting
approval"); admin approves → user logs in; admin declines → user is blocked with the reason;
audit log records both. With the toggle off, registration behaves as today.

**Status (2026-09-01): DONE — migration `20260901000000_registration_approval` applied.**
- Schema: `PENDING` added to `enum AccountStatus`. Hand-authored migration
  (`ALTER TABLE users MODIFY status ENUM(...)`) applied via `prisma migrate deploy`;
  `prisma generate` run; no drift.
- Setting: `requireRegistrationApproval` (default `false`) added to
  `PLATFORM_SETTING_KEYS` + `DEFAULTS` (`src/lib/settings.ts`),
  `updatePlatformSettingSchema` enum, and `SETTING_META` in `PlatformSettingsForm`. No seed
  row needed — `getSetting` falls back to the default.
- `POST /api/register`: reads the setting once; when on, both learner and tutor helpers
  create the user with `status: "PENDING"` and return `201 { message: <pending copy>,
  pendingApproval: true }`.
- `src/lib/auth.ts` `authorize`: `PENDING` accounts are blocked at login with
  "awaiting admin approval" (mirrors SUSPENDED/BANNED).
- New `GET /api/admin/registrations` — paginated (`registrations` key), `q` search over
  name/email/anon ID, `status: "PENDING"`, oldest-first. New
  `PATCH /api/admin/registrations/[userId]` — `{ decision: "APPROVE" | "DECLINE", reason? }`:
  approve → `ACTIVE`, decline → `BANNED` + `statusReason`; both in a `$transaction` with an
  `AuditLog` row (`USER_APPROVED` / `USER_DECLINED`). 404 for unknown user, 400 if the row
  is not `PENDING`.
- `src/lib/auditLog.ts`: `USER_APPROVED`, `USER_DECLINED` added; `AuditLogTable`
  `ACTION_LABELS` gets "Registration Approved / Declined".
- UI: new `src/app/admin/registrations/page.tsx` + `RegistrationApprovalTable.tsx`
  (search, paginated table, inline Approve, Decline modal with reason). Nav entry
  ("Registrations", `UserCheck` icon) in `src/app/admin/layout.tsx`. Admin dashboard
  (`src/app/admin/page.tsx`) gets a "Pending registrations" count + link; its
  "Flagged accounts" count now excludes `PENDING` (`notIn ["ACTIVE", "PENDING"]`).
- Register → login handoff: `RegisterForm` appends `&pending=true`; `LoginForm` shows the
  approval-pending message instead of the "please log in" one.
- Tests: `src/app/api/admin/registrations/__tests__/route.test.ts` +
  `.../[userId]/__tests__/route.test.ts` (401/404/400/approve/decline+audit/500); register
  route test adds the approval-on PENDING path; `auth.test.ts` adds the PENDING block.
  `tsc` / `lint` / 292 tests green.

---

## Global verification

- After each chunk: `pnpm exec tsc --noEmit` && `pnpm lint` && `pnpm test` clean.
- New/changed API routes get Vitest coverage in `__tests__/` (positive, 400 validation,
  401/403 RBAC, 409 conflicts, 500 resilience) per `CLAUDE.md` §6 — especially
  Chunks 4, 5, 8, 10, 12, 13.
- Manual smoke via `pnpm dev` per portal:
  - Learner: dashboard, browse+filter, match, edit request, tutor profile (setting on/off),
    class cards.
  - Tutor: dashboard + suspension banner, class edit with sessions, suspended class view,
    student search, assessments (rejected), class code.
  - Admin: users table (font/page size/detail), class detail, certifications
    (tabs/search/sort), audit log filters, reports charts, settings toggles, registrations
    queue.
- Schema chunks: run `npx prisma generate` after each migration; verify `docs/erd.md`
  regenerates cleanly (prisma-erd-generator runs on generate).
- No commits/pushes without the user asking; each schema migration confirmed first.

## Suggested sequencing

`1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9`, then confirm-and-go `10 → 11 → 12 → 13`.
Chunks 1 and 2 are prerequisites for most others; 4 depends on 1; 8's Rejected tab is
finished by 10.
