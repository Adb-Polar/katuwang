# ADMIN Role

The `ADMIN` role manages the Katuwang platform: moderating accounts and classes, reviewing tutor certifications, configuring platform-wide settings, and viewing reports. Admins access the `/admin` portal. Admin accounts cannot be moderated by other admins (self/peer protection is enforced at the API level).

Source: `src/app/admin/**`, `src/app/api/admin/**`, `src/components/admin/**`

---

## User Management (`/admin/users`)

- **List & search learner/tutor accounts** — paginated list of all `STUDENT_LEARNER` and `STUDENT_TUTOR` users (admins are excluded from the list). Filterable by role, account status, and free-text search across first name, last name, email, and anonymous ID.
  (`GET /api/admin/users`)
- **Suspend a user** — set a user's account status to `SUSPENDED`, with a required reason and an optional duration in days. If a duration is given, the suspension auto-expires (`statusExpiresAt`); if omitted, the suspension is indefinite until an admin lifts it.
  (`PATCH /api/admin/users/[userId]`)
- **Ban a user** — set a user's account status to `BANNED` (indefinite, with a reason).
- **Reactivate a user** — restore a suspended/banned account back to `ACTIVE`.
- **Registration approval** (`/admin/registrations`, active while `requireRegistrationApproval` is on) — approve → `ACTIVE`; decline → `DECLINED` (distinct from `BANNED`, which is a policy action on an already-active account). A declined applicant can't sign in; when they try, they're sent to `/account-declined`, which shows the decline reason. The Users table hides `DECLINED` accounts unless you filter for that status.
- **Email verification** (toggle `requireEmailVerification` in Platform Settings, added 2026-09-14) — when on, new accounts must click an emailed link before they can log in (`User.emailVerifiedAt`, `VerificationToken` model), checked *before* `requireRegistrationApproval`. Defaults off: turning it on retroactively blocks every existing account with no verified email, so only enable it once that's accounted for.
- Every status change is written to the audit log automatically.
- Admin accounts cannot be modified through this endpoint (`400 Cannot modify an admin account`).

## Class Moderation (`/admin/classes`)

- **List & search all tutor classes** platform-wide — paginated, filterable by subject and status, free-text search across class code, topic, tutor first/last name, and tutor anonymous ID. Each row shows the class code above the subject.
  (`GET /api/admin/classes`)
- **Suspend a class** — only a `SCHEDULED` class can be suspended; requires a reason and optional duration (auto-reinstates when the duration elapses, see `reinstateExpiredClasses`).
- **Ban a class** — a `SCHEDULED` or `SUSPENDED` class can be banned (indefinite, with a reason); the owning tutor can no longer modify it.
- **Reinstate a class** — a `SUSPENDED` or `BANNED` class can be returned to `SCHEDULED`.

## Class Appeals (`/admin/class-appeals`)

- Tutors can contest a suspension/ban on one of their classes. The queue has Pending / Approved / Rejected tabs; each row shows the class, the moderation reason, and the tutor's appeal text.
- **Approve** → the appeal is `APPROVED`, the class is reinstated to `SCHEDULED` (moderation reason/expiry cleared), an audit row is written, and the tutor gets a `CLASS_APPEAL_APPROVED` notification.
- **Reject** (with an optional note) → the appeal is `REJECTED`, the moderation stands, and the tutor gets `CLASS_APPEAL_REJECTED`. The tutor may appeal again.
  (`GET /api/admin/class-appeals`, `PATCH /api/admin/class-appeals/[appealId]`)
  (`PATCH /api/admin/classes/[classId]`)
- All class moderation actions are recorded in the audit log.
- **Banning** a class re-opens any topic request still linked to it (`status in ACCEPTED, ENROLLED` → `OPEN`, `fulfilledClassId` nulled, learner notified) in the same transaction.

## Abuse Reports (`/admin/abuse-reports`)

- Learners report a **tutor** or a **class** from a checklist of common violations plus an optional "Other" free-text message (a learner can only report a tutor whose class they joined, or a class they're enrolled in). The queue has Pending / Resolved / Dismissed tabs plus a **target filter** (All / Tutor reports / Class reports); each row shows the target (tutor `TUT-XXXX` or a link to the class), the reporter as `STU-XXXX` only (never a real name), the ticked reasons, and any free-text detail.
- **Resolve** (confirm dialog, optional note) → the report is `RESOLVED`, an audit row is written (`REPORT_RESOLVED`, target `REPORT`), and the reporter gets a `REPORT_REVIEWED` notification. Use this once you've acted on it.
- **Dismiss** (optional note) → the report is `DISMISSED`, audit `REPORT_DISMISSED`, reporter gets `REPORT_REVIEWED`.
- This screen does **not** suspend or ban anyone — apply enforcement from the Users or Classes pages. A report can only be reviewed once.
  (`GET /api/admin/abuse-reports`, `PATCH /api/admin/abuse-reports/[reportId]`)

## Topic Request Moderation (`/admin/topic-requests`)

- **List & search all topic requests** platform-wide — paginated, filterable by status, subject, and `scope` (`public` vs `directed`), free-text search across the learner's name/anonymous ID and topic text. Each row shows the learner (anonymized + real name, admin accountability view), the directed-to tutor (if any), and the linked class summary (if any).
  (`GET /api/admin/topic-requests`)
- **Close a request** — set a non-terminal request to `CANCELLED` with an optional reason; nulls `fulfilledClassId` (the class, if any, is left alone — only the link is cleared). Learner is notified.
- **Re-open a request** — set a `CANCELLED` or `ACCEPTED` request back to `OPEN`; nulls `fulfilledClassId`. Learner is notified.
  (`PATCH /api/admin/topic-requests/[id]`)
- All actions are recorded in the audit log (`TOPIC_REQUEST_STATUS_CHANGE` / `TOPIC_REQUEST`).
- A `TutorClass` an admin **bans** also re-opens any topic request still linked to it (`→ OPEN`, unlinked, learner notified) — see Class Moderation below.

## Tutor Certification Review (`/admin/assessment/certifications`)

- Lives in the **Assessment** nav group alongside Question Bank / Requests / Results / Session Tests — it's the human sign-off on a passed assessment. `/admin/certifications` (old path) permanently redirects here.
- When `autoCertifyOnAssessmentPass` is **off** (default), a tutor who passes an assessment gets a `PENDING` `TopicCertification` that shows up on the Pending tab for an admin to approve; when it's **on**, passing goes straight to `CERTIFIED` and the Pending tab stays empty (Certified/Rejected tabs remain the certification ledger).
- **Review topic certification requests** — Pending / Certified / Rejected tabs, with topic + tutor-ID search, subject filter, sort, and pagination. Each row shows the requesting tutor's anonymized + real identity (admin-only view retains real names for accountability).
  (`GET /api/admin/certifications?status=&q=&subject=&sort=&page=&pageSize=`)
- **Approve a certification request** — marks the request `CERTIFIED`, stamps `certifiedAt` + `reviewedAt`. Certified tutors are trusted to teach that specific topic (used to gate class creation when `requireCertificationForClassCreation` is enabled).
- **Reject a certification request** — marks the request `REJECTED`, stamps `reviewedAt`, and stores an optional `reviewNote` (feedback shown to the tutor). The row is kept (not deleted); the tutor can re-request, which reopens it as `PENDING`.
  (`PATCH /api/admin/certifications/[certificationId]`)
- Certification decisions are recorded in the audit log (the rejection note is copied to the log `reason`).

## Platform Settings (`/admin/settings`)

Admin-configurable boolean flags stored in `PlatformSetting`:

- **`registrationOpen`** — toggles whether new learner/tutor registrations are accepted (`POST /api/register` checks this and returns `403` when closed). Defaults to `true`.
- **`requireCertificationForClassCreation`** — when enabled, tutors may only create a class covering topics they hold a `CERTIFIED` `TopicCertification` for. Defaults to `false`.
- **`matchingEnabled`** — when disabled, the learner "Find a Class" matcher (`POST /api/learner/match`), topic requests (`/api/learner/topic-requests`), and the tutor request queue (`/api/tutor/topic-requests`) all return `403`. Defaults to `true`.
- **`sessionTestsEnabled`** — when disabled, a tutor cannot create or publish a session test and a learner cannot start a pre/post attempt; already-collected results stay fully readable regardless. Defaults to `true`.
- **`requireEmailVerification`** (added 2026-09-14) — see User Management above. Defaults to `false`.

(`GET`/`PATCH /api/admin/settings`)

This page also has a **My Account** section (added 2026-09-14) to change your own password — the
first self-service account surface admins have had, since this page previously covered only
platform-wide settings. (`POST /api/admin/profile/password`, `401` on a wrong current password.)

## Reports & Analytics (`/admin/reports`)

Read-only platform breakdown dashboard, aggregated via Prisma `groupBy`:

- Users by role, by grade level, and by account status.
- Classes by subject and by status.
- Certifications by status.
- Total enrollments and enrollments in the last 30 days.

(`GET /api/admin/reports`)

## Audit Log (`/admin/audit-log`)

- **View moderation action history** — the most recent 200 `AuditLog` entries (user status changes, class status changes, certification approvals/rejections), each showing which admin performed the action, the action type, target type/ID, optional reason, and timestamp.
  (`GET /api/admin/audit-log`)

## Notifications (`/admin/notifications`)

- A **Notifications** sidebar item (bell icon, under "Review") shows an unread-count badge, and the topbar bell shows a red dot when you have unread notifications — clicking it opens a dropdown of the 8 most recent. Both refresh on navigation.
- The page (and the dropdown) list notifications newest first. Clicking a row marks **just that one** read and follows its link if it has one; a "Mark all read" button clears the rest.
- The moderation actions an admin performs (approve registration, review certification, resolve a question request, ban a class) send notifications to the **affected tutor or learner**, not to admins.
- Admin-directed notifications so far: when a tutor submits a **question-bank request** (`POST /api/tutor/question-requests`), every active admin gets a `QUESTION_REQUEST_NEW` notification linking to `/admin/assessment/requests`.
  (`GET /api/notifications`, `POST /api/notifications/read` — not admin-gated)

## Chatbot assistant

- The same floating **intent-based** help widget shown to learners and tutors also appears in the admin portal (nav help for Registrations, Certifications, Question Bank, moderation, Reports, Settings; plus general FAQs). Rule/keyword matching — not a generative AI.
- **Toggle:** *Settings → Chatbot assistant* (`chatbotEnabled`, default ON). When off, the widget is hidden everywhere and `POST /api/chatbot` returns `403`.
- **Unmatched queries** are logged to the `chatbot_misses` table (`message`, `role`, `userId`, `createdAt`).
  (`POST /api/chatbot` — not admin-gated)

## Chatbot misses (`/admin/chatbot`)

- **Review unanswered questions** — every logged `ChatbotMiss` grouped by role + normalised wording (case/punctuation-insensitive), showing the most recent phrasing, a count, and first/last-seen timestamps. Sortable by count / first seen / last seen; filterable by role and a text search. Read-only — use it to grow `src/lib/chatbot/faq.ts` / `intents.ts` with real, recurring questions.
  (`GET /api/admin/chatbot-misses`)

## Session Tests (`/admin/session-tests`)

Read-only visibility into every tutor-built session pre/post-test, double-blind
throughout (never a learner's real name/id, only `anonymousId`):

- **List** — every `SessionTest` across the platform, paginated, filterable by
  subject, status (`DRAFT`/`PUBLISHED`/`CLOSED`), and a text search across
  title/class code/tutor anonymous id. Each row shows the class, tutor,
  session topic, status, and question/attempt counts.
  (`GET /api/admin/session-tests`)
- **View results** — the same per-question and per-learner pre/post/delta
  breakdown the tutor sees, plus per-attempt drill-down.
  (`GET /api/admin/session-tests/[testId]/results`, `.../attempts/[attemptId]`)
- Cannot create, edit, publish, or close a test — building is tutor-only;
  this page is oversight, not authoring.

## Subjects & Topics (`/admin/subjects`)

- The subject/topic taxonomy is admin-editable (was a compile-time enum + static list). Subjects have a display `name` and an immutable `slug` (what every `subject` column stores); topics belong to a subject.
- **Add / rename / reorder / activate-deactivate** subjects and topics. **Renaming a topic** rewrites the stored topic string on every class, session, request, certification, question, and attempt that used it (one transaction).
- **Deleting** a subject is blocked (`409`) while any class / request / question / certification / attempt references its slug — deactivate it instead. **Deleting a topic** that's in use soft-deletes it (`active: false`, hidden from new dropdowns); an unused topic is removed outright. `slug` cannot be changed.
  (`GET/POST /api/admin/subjects`, `PATCH/DELETE /api/admin/subjects/[id]`, `POST /api/admin/subjects/[id]/topics`, `PATCH/DELETE /api/admin/topics/[id]`, `GET /api/subjects` — read-only, any authed role)

## API Reference

All endpoints below require an authenticated session with `role === "ADMIN"`, or respond `401 { error: "Unauthorized." }`.

### `GET /api/search`
Quick search behind the top-bar box. **Not** admin-gated (any authenticated role), but results are role-scoped: an admin sees all classes, all non-admin accounts, and topic matches.

**Query params**: `q` (required; fewer than 2 characters returns `{ groups: [] }`).

**200** → `{ groups: [{ kind: "class" | "tutor" | "topic", label, items: [{ id, title, subtitle?, href }] }] }`. Max 6 items per group; account rows link to `/admin/users/[id]`, class rows to a pre-filtered `/admin/classes`.
**401** → not authenticated.
**500** → `{ error }`.

### `GET /api/admin/users`
List/search learner + tutor accounts (admins excluded).

**Query params** (all optional): `q` (free-text: first/last name, email, anonymous ID), `role` (`STUDENT_LEARNER` \| `STUDENT_TUTOR`), `status` (`ACTIVE` \| `SUSPENDED` \| `BANNED` \| `PENDING` \| `DECLINED` — omitted excludes `DECLINED`), `page` (default `1`), `pageSize` (default `10`, max `100`).

**200** → `{ users: User[], total, page, pageSize }` — each `User` includes `id, anonymousId, firstName, lastName, email, role, gradeLevel, section, status, statusReason, statusUpdatedAt, statusExpiresAt, createdAt`.

**500** → `{ error }`.

### `PATCH /api/admin/users/[userId]`
Suspend, ban, or reactivate a learner/tutor account.

**Body**
```json
{ "status": "ACTIVE" | "SUSPENDED" | "BANNED", "reason": "string (≤500 chars, optional)", "durationDays": "int 1–365 (optional; SUSPENDED only)" }
```
- `durationDays` set → `statusExpiresAt` computed via `computeExpiresAt`; omitted → indefinite (`null`).
- Writes an `AuditLog` entry (`USER_STATUS_CHANGE`) in the same transaction.

**200** → updated `{ id, anonymousId, status, statusReason, statusUpdatedAt, statusExpiresAt }`.
**400** → target is an admin account (`"Cannot modify an admin account."`) or body fails Zod validation.
**404** → user not found.
**500** → `{ error }`.

### `GET /api/admin/classes`
List/search all tutor classes platform-wide.

**Query params** (all optional): `q` (topic, tutor first/last name, tutor anonymous ID), `subject` (subject slug string), `status` (`ClassStatus` enum), `page`, `pageSize` (same defaults as users).

**200** → `{ classes: TutorClass[], total, page, pageSize }` — each class includes `topics: string[]`, `tutor: { id, anonymousId, firstName, lastName }`, and enrollment count.
**500** → `{ error }`.

### `PATCH /api/admin/classes/[classId]`
Suspend, ban, or reinstate a class.

**Body**
```json
{ "status": "SCHEDULED" | "SUSPENDED" | "BANNED", "reason": "string (≤500 chars, optional)", "durationDays": "int 1–365 (optional; SUSPENDED only)" }
```
- `SUSPENDED` allowed only from `SCHEDULED`.
- `BANNED` allowed only from `SCHEDULED` or `SUSPENDED`.
- `SCHEDULED` (reinstate) allowed only from `SUSPENDED` or `BANNED`.
- `durationDays` set on suspend → `suspendedUntil` computed; class auto-reinstates via `reinstateExpiredClasses` once elapsed.
- Writes an `AuditLog` entry (`CLASS_STATUS_CHANGE`).

**200** → updated `TutorClass`.
**400** → invalid state transition or failed validation.
**404** → class not found.
**500** → `{ error }`.

### `GET /api/admin/topic-requests`
List/search all topic requests platform-wide.

**Query params** (all optional): `q` (learner first/last name, anonymous ID, or topic text), `status` (`TopicRequestStatus` enum), `subject` (subject slug string), `scope` (`"public"` | `"directed"`), `page`, `pageSize` (same defaults as users).

**200** → `{ requests: [{ id, subject, gradeLevel, note, status, createdAt, topics: string[], learner: { id, anonymousId, firstName, lastName }, directedTo: { anonymousId } | null, fulfilledClass: { id, code, status, nextSessionAt } | null }], total, page, pageSize }` — real learner name included (admin-only accountability view).
**401** → not an admin.
**500** → `{ error }`.

### `PATCH /api/admin/topic-requests/[id]`
Close or re-open a topic request.

**Body**
```json
{ "status": "OPEN" | "CANCELLED", "reason": "string (≤500 chars, optional)" }
```
- `CANCELLED` allowed from any non-terminal status (`400` if already `CANCELLED`/`FULFILLED`).
- `OPEN` allowed only from `CANCELLED` or `ACCEPTED` (`400` otherwise).
- Always nulls `fulfilledClassId` (the linked class, if any, is left alone).
- Writes an `AuditLog` entry (`TOPIC_REQUEST_STATUS_CHANGE` / `TOPIC_REQUEST`) and notifies the learner, all in one transaction.

**200** → `{ id, status }`.
**400** → invalid state transition or failed validation.
**401** → not an admin. **404** → request not found.
**500** → `{ error }`.

### `GET /api/admin/abuse-reports`
List learner abuse reports, tabbed by status. Requires `role === "ADMIN"` (`401`).

**Query params** (all optional): `status` (`PENDING` default / `RESOLVED` / `DISMISSED`), `targetType` (`TUTOR` / `CLASS` — omit for all), `page` (default `1`), `pageSize` (default `10`, max `100`), `sort` (`createdAt` / `reviewedAt` / `targetType` / `status`) + `dir` (`asc` / `desc`).

**200** → `{ reports: [{ id, targetType, status, details, resolutionNote, createdAt, reviewedAt, violations: string[], reporter: { anonymousId }, class: { id, code, subject, status } | null, tutor: { id, anonymousId } | null }], total, page, pageSize }`.
**500** → `{ error }`.

### `PATCH /api/admin/abuse-reports/[reportId]`
Resolve or dismiss a pending report.

**Body**: `{ "decision": "RESOLVE" | "DISMISS", "resolutionNote": "string (≤500, optional)" }`.
- Sets `status` to `RESOLVED` / `DISMISSED` plus `reviewedById` / `reviewedAt`, writes an `AuditLog` (`REPORT_RESOLVED` / `REPORT_DISMISSED`, target `REPORT`), and notifies the reporter (`REPORT_REVIEWED` → `/learner/reports`), all in one transaction. Does not change any account or class status.

**200** → the updated report.
**400** → invalid body, or the report is not `PENDING`.
**401** → not an admin. **404** → report not found.
**500** → `{ error }`.

### `GET /api/admin/certifications`
List topic certification requests, filtered/sorted/paginated.

**Query params** (all optional): `status` (`PENDING` default / `CERTIFIED` / `REJECTED`), `q` (topic or tutor `anonymousId`, `contains`), `subject` (subject slug string), `sort` (`requested` default / `certified` / `reviewed` / `subject`), `page` (default `1`), `pageSize` (default `10`, max `100`).

**200** → `{ certifications: [{ ...TopicCertification, tutor: { id, anonymousId, firstName, lastName, email } }], total, page, pageSize }` (real identity included — admin-only accountability view). `REJECTED` defaults to newest-reviewed-first.
**401** → not an admin.
**500** → `{ error }`.

### `PATCH /api/admin/certifications/[certificationId]`
Approve or reject a pending certification request.

**Body**
```json
{ "status": "CERTIFIED" | "REJECTED", "reviewNote": "optional feedback (<=500 chars)" }
```
- `CERTIFIED` → sets `status`, stamps `certifiedAt` + `reviewedAt`, clears `reviewNote`, logs `CERTIFICATION_APPROVED`.
- `REJECTED` → sets `status`, stamps `reviewedAt`, stores `reviewNote` (or `null`), clears `certifiedAt`, logs `CERTIFICATION_REJECTED` with the note as `reason`. The row is retained.

**200** → the updated `TopicCertification`.
**400** → certification is not `PENDING`, or failed validation.
**401** → not an admin.
**404** → certification not found.
**500** → `{ error }`.

### `GET /api/admin/settings`
List all platform settings.

**200** → `[{ key: "registrationOpen" | "requireCertificationForClassCreation", value: boolean }, ...]`.
**500** → `{ error }`.

### `PATCH /api/admin/settings`
Update one platform setting (upserts into `PlatformSetting`).

**Body**
```json
{ "key": "registrationOpen" | "requireCertificationForClassCreation" | "matchingEnabled", "value": true }
```
**200** → `{ key, value }`.
**400** → invalid key or non-boolean value.
**500** → `{ error }`.

### `GET /api/admin/reports`
Read-only platform breakdown dashboard (Prisma `groupBy` aggregates).

**200**
```json
{
  "usersByRole": [{ "role": "...", "count": 0 }],
  "usersByGradeLevel": [{ "gradeLevel": "...", "count": 0 }],
  "usersByStatus": [{ "status": "...", "count": 0 }],
  "classesBySubject": [{ "subject": "...", "count": 0 }],
  "classesByStatus": [{ "status": "...", "count": 0 }],
  "certificationsByStatus": [{ "status": "...", "count": 0 }],
  "enrollments": { "total": 0, "last30Days": 0 }
}
```
**500** → `{ error }`.

### `GET /api/admin/audit-log`
Most recent 200 `AuditLog` entries.

**200** → array of `{ id, adminId, admin: { anonymousId, firstName, lastName }, action, targetType, targetId, reason, createdAt }`, newest first.
**500** → `{ error }`.

### `GET /api/admin/chatbot-misses`
`ChatbotMiss` rows grouped by role + normalised message text (aggregation happens
in JS over the most recent 2000 rows — the group key isn't a stored column).

**Query params** (all optional): `role` (`STUDENT_LEARNER` | `STUDENT_TUTOR` | `ADMIN`),
`q` (substring match on the raw message), `sort` (`lastSeen` default | `count` |
`firstSeen`), `dir` (`asc` | `desc`, default `desc`), `page` (default `1`), `pageSize`
(default `25`, max `200`).

**200** → `{ groups: [{ normalized, sample, role, count, firstSeen, lastSeen }], total, page, pageSize }`.
**500** → `{ error }`.

### Session tests (read-only)

- `GET /api/admin/session-tests?subject=&status=&q=&page=&pageSize=` → paginated list, join-flattened to `{ id, title, status, classCode, subject, sessionTopic, scheduledAt, sessionStatus, tutor: {id, anonymousId}, questionCount, attemptCount }`.
- `GET /api/admin/session-tests/[testId]/results` → same shape as the tutor results view.
- `GET /api/admin/session-tests/[testId]/attempts/[attemptId]` → one attempt, double-blind (`learner: {anonymousId}` only).
- No write routes — admins observe, they don't author or publish.

## What Admins Cannot Do

- Cannot view or modify another admin's account.
- Cannot see the real names of learners/tutors in learner-/tutor-facing peer contexts (double-blind anonymity is preserved everywhere except the admin moderation surfaces above, which exist specifically for accountability/enforcement per RA 10173 compliance design).
- Cannot create classes, enroll in classes, or request certifications themselves — those are tutor/learner-only actions.

## Help & FAQs (`/admin/help`)

- In-portal Help Center: **Jump to** quick links, **step-by-step guides** (approve/decline registrations, review certifications, maintain the question bank, configure assessment rules, moderate classes and appeals, manage subjects & topics), and a **searchable FAQ** accordion covering users, assessment, moderation, settings, analytics, and privacy topics.
- Content is static (`src/lib/help/helpContent.ts`, `ADMIN` entry) rendered by the shared `HelpCenter` component; no API. Also reachable from the topbar `?` button.
