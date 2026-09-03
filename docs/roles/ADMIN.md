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
- Every status change is written to the audit log automatically.
- Admin accounts cannot be modified through this endpoint (`400 Cannot modify an admin account`).

## Class Moderation (`/admin/classes`)

- **List & search all tutor classes** platform-wide — paginated, filterable by subject and status, free-text search across class code, topic, tutor first/last name, and tutor anonymous ID. Each row shows the class code above the subject.
  (`GET /api/admin/classes`)
- **Suspend a class** — only a `SCHEDULED` class can be suspended; requires a reason and optional duration (auto-reinstates when the duration elapses, see `reinstateExpiredClasses`).
- **Ban a class** — a `SCHEDULED` or `SUSPENDED` class can be banned (indefinite, with a reason); the owning tutor can no longer modify it.
- **Reinstate a class** — a `SUSPENDED` or `BANNED` class can be returned to `SCHEDULED`.
  (`PATCH /api/admin/classes/[classId]`)
- All class moderation actions are recorded in the audit log.
- **Banning** a class re-opens any topic request still linked to it (`status in ACCEPTED, ENROLLED` → `OPEN`, `fulfilledClassId` nulled, learner notified) in the same transaction.

## Topic Request Moderation (`/admin/topic-requests`)

- **List & search all topic requests** platform-wide — paginated, filterable by status, subject, and `scope` (`public` vs `directed`), free-text search across the learner's name/anonymous ID and topic text. Each row shows the learner (anonymized + real name, admin accountability view), the directed-to tutor (if any), and the linked class summary (if any).
  (`GET /api/admin/topic-requests`)
- **Close a request** — set a non-terminal request to `CANCELLED` with an optional reason; nulls `fulfilledClassId` (the class, if any, is left alone — only the link is cleared). Learner is notified.
- **Re-open a request** — set a `CANCELLED` or `ACCEPTED` request back to `OPEN`; nulls `fulfilledClassId`. Learner is notified.
  (`PATCH /api/admin/topic-requests/[id]`)
- All actions are recorded in the audit log (`TOPIC_REQUEST_STATUS_CHANGE` / `TOPIC_REQUEST`).
- A `TutorClass` an admin **bans** also re-opens any topic request still linked to it (`→ OPEN`, unlinked, learner notified) — see Class Moderation below.

## Tutor Certification Review (`/admin/certifications`)

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

(`GET`/`PATCH /api/admin/settings`)

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
- The moderation actions an admin performs (approve registration, review certification, resolve a question request, ban a class) send notifications to the **affected tutor or learner**, not to admins — so an admin's own list is usually empty today. The page + count exist for parity and for future admin-directed notifications.
  (`GET /api/notifications`, `POST /api/notifications/read` — not admin-gated)

## API Reference

All endpoints below require an authenticated session with `role === "ADMIN"`, or respond `401 { error: "Unauthorized." }`.

### `GET /api/admin/users`
List/search learner + tutor accounts (admins excluded).

**Query params** (all optional): `q` (free-text: first/last name, email, anonymous ID), `role` (`STUDENT_LEARNER` \| `STUDENT_TUTOR`), `status` (`ACTIVE` \| `SUSPENDED` \| `BANNED`), `page` (default `1`), `pageSize` (default `10`, max `100`).

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

**Query params** (all optional): `q` (topic, tutor first/last name, tutor anonymous ID), `subject` (`SubjectArea` enum), `status` (`ClassStatus` enum), `page`, `pageSize` (same defaults as users).

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

**Query params** (all optional): `q` (learner first/last name, anonymous ID, or topic text), `status` (`TopicRequestStatus` enum), `subject` (`SubjectArea` enum), `scope` (`"public"` | `"directed"`), `page`, `pageSize` (same defaults as users).

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

### `GET /api/admin/certifications`
List topic certification requests, filtered/sorted/paginated.

**Query params** (all optional): `status` (`PENDING` default / `CERTIFIED` / `REJECTED`), `q` (topic or tutor `anonymousId`, `contains`), `subject` (`SubjectArea`), `sort` (`requested` default / `certified` / `reviewed` / `subject`), `page` (default `1`), `pageSize` (default `10`, max `100`).

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

## What Admins Cannot Do

- Cannot view or modify another admin's account.
- Cannot see the real names of learners/tutors in learner-/tutor-facing peer contexts (double-blind anonymity is preserved everywhere except the admin moderation surfaces above, which exist specifically for accountability/enforcement per RA 10173 compliance design).
- Cannot create classes, enroll in classes, or request certifications themselves — those are tutor/learner-only actions.
