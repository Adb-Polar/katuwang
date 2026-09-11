# Topic Requests v2 — public/directed, tutor accept-to-class, notifications, admin moderation

## Context

Sprint 3 shipped a basic Topic Request flow: a learner posts a request, a tutor "offers" an
existing class, the request flips to `FULFILLED`. The user wants a richer lifecycle:

- A request is either **public** (every eligible tutor sees it) or **directed** to one tutor
  (only that tutor sees it; that tutor is notified).
- Tutors get a **browse page** for requests. A tutor may **accept** a request only for a topic
  they hold a `CERTIFIED` certification in. Accepting **auto-creates a class** (full class form,
  pre-filled from the request) and **notifies the learner**.
- An accepted request **does not disappear** — it stays linked to the created class. It becomes
  invisible to everyone only once the **learner enrolls** in that class. If the tutor later
  **cancels the class**, the request **re-opens**. If the class is **completed**, the request is
  marked **`FULFILLED`** (terminal, hidden from the pool).
- **Admin** gets a moderation surface for topic requests (list/filter, force-cancel, re-open),
  audit-logged like class/user moderation.

This needs a real **notification system** (new `Notification` model + pages + sidebar unread
badge) — the app currently has none.

Confirmed choices: tutor UI = **one `/tutor/requests` page with two tabs**; accept dialog = the
**full class form** pre-filled from the request; notifications = **full DB-backed system**;
learner cancelling an already-accepted request = **keep the class, just unlink + cancel**.

---

## Status lifecycle (`TopicRequestStatus`)

```
enum TopicRequestStatus { OPEN  ACCEPTED  ENROLLED  FULFILLED  CANCELLED }
```

| Status | Meaning | Visible in tutor pool? | Visible to accepting tutor? | Learner sees |
|---|---|---|---|---|
| `OPEN` | posted, unclaimed | yes (public → eligible tutors; directed → the one tutor) | — | "Waiting for a tutor" + Cancel |
| `ACCEPTED` | tutor created a class, learner not yet enrolled | **no** | yes ("Accepted by me") | "A class was created — Enroll now" + Cancel |
| `ENROLLED` | learner enrolled in the created class | **no** | yes | "Enrolled — class in progress" |
| `FULFILLED` | the created class was completed | no | no (done) | "Completed ✓" |
| `CANCELLED` | withdrawn by learner or closed by admin | no | no | "Cancelled" |

Transitions:

| From → To | Trigger | Side effects |
|---|---|---|
| `OPEN → ACCEPTED` | tutor `POST .../accept` | create `TutorClass` + link `fulfilledClassId`; notify learner (`TOPIC_REQUEST_ACCEPTED`) |
| `OPEN → CANCELLED` | learner `PATCH .../[id]` | — |
| `ACCEPTED → ENROLLED` | learner enrolls in `fulfilledClass` (hook in enroll route) | — |
| `ENROLLED → ACCEPTED` | learner unenrolls from `fulfilledClass` (hook in unenroll route) | — |
| `ACCEPTED → CANCELLED` | learner `PATCH .../[id]` | null `fulfilledClassId` (class kept) |
| `ACCEPTED / ENROLLED → OPEN` | tutor sets the linked class to `CANCELLED` (class PATCH), tutor deletes it, or admin bans it | null `fulfilledClassId`; notify learner (`TOPIC_REQUEST_REOPENED`) |
| `ACCEPTED / ENROLLED → FULFILLED` | linked class set to `COMPLETED` (class PATCH) | notify learner (`TOPIC_REQUEST_FULFILLED`) |
| any non-terminal `→ CANCELLED` / `CANCELLED,ACCEPTED → OPEN` | admin `PATCH /api/admin/topic-requests/[id]` | null `fulfilledClassId`; `AuditLog` |

---

## Data model (`prisma/schema.prisma`) — migration required

Extend the enum (additive) and `TopicRequest`:

```prisma
model TopicRequest {
  // ...existing fields...
  status                 TopicRequestStatus @default(OPEN)   // enum gains ACCEPTED, ENROLLED
  directedTutorProfileId String?
  directedTutor          TutorProfile? @relation("DirectedTopicRequests", fields: [directedTutorProfileId], references: [id], onDelete: SetNull)
  // fulfilledClassId / fulfilledClass stay as-is (onDelete: SetNull)
  @@index([status, subject])
  @@index([directedTutorProfileId, status])
}

model TutorProfile {
  // ...
  directedTopicRequests TopicRequest[] @relation("DirectedTopicRequests")
}
```

The "accepting tutor" is derived via `fulfilledClass.tutorProfile` — no extra column.

New notification model + `User` back-relation:

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String    // TOPIC_REQUEST_DIRECTED | TOPIC_REQUEST_ACCEPTED | TOPIC_REQUEST_REOPENED | TOPIC_REQUEST_FULFILLED
  message   String    @db.Text
  link      String?
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([userId, readAt])
  @@map("notifications")
}
```

`npx prisma migrate dev --name topic_requests_directed_and_notifications` + `npx prisma generate`
(**needs user confirmation** — DB change).

---

## Shared logic

- **`src/lib/validations/match.ts`**
  - `createTopicRequestSchema` gains `directedTutorId: z.string().min(1).optional()`.
  - Replace `fulfillTopicRequestSchema` with `acceptTopicRequestSchema = createClassSchema` (reuse
    from `src/lib/validations/class.ts` — the accept body *is* a class-creation payload).
  - Keep `cancelTopicRequestSchema` (`{ status: "CANCELLED" }`).
- **`src/lib/validations/admin.ts`** — `moderateTopicRequestSchema`:
  `{ status: z.enum(["OPEN","CANCELLED"]), reason?: string.max(500) }`.
- **`src/lib/auditLog.ts`** — add `AUDIT_ACTIONS.TOPIC_REQUEST_STATUS_CHANGE` and
  `AUDIT_TARGET_TYPES.TOPIC_REQUEST`.
- **`src/lib/notifications.ts`** (new, pure-ish helper): `notify(tx, userId, type, message, link)`
  → `tx.notification.create(...)`; `notifyMany(...)`. Used inside transactions in the routes/hooks.
- **`src/lib/topicRequestVisibility.ts`** (new): `tutorPoolWhere(tutorProfileId, certifiedTopics)`
  → the Prisma `where` for the tutor "Open to me" tab:
  `status: "OPEN"` AND (`directedTutorProfileId = me` OR (`directedTutorProfileId: null` AND
  `topics: { some: { topic: { in: certifiedTopicNames } } }` AND `subject: { in: certifiedSubjects }`)).
  Reused by the tutor GET route and the accept route's eligibility check.
- **`src/components/tutor/ClassScheduleFields.tsx`** (new) — extract the schedule-class form body
  (subject/gradeLevel/topics/description/sessions/location/capacity/meetingLink + local state +
  validation) currently inline in `src/components/tutor/ClassManagement.tsx`. Props: `initial`
  values, `subjectLocked?`, `submitLabel`, `onSubmit(payload)`. `ClassManagement` and the new
  `AcceptRequestModal` both render it. Keeps one class-form implementation.

---

## API routes

Guards/format per existing convention (`401` role, `400` first Zod issue, `500` on throw).
`matchingEnabled` gates all learner/tutor topic-request routes (`403` when off); admin +
notification routes are **not** gated.

| Route | Method | Behavior |
|---|---|---|
| `api/learner/topic-requests/route.ts` | `POST` | Body `createTopicRequestSchema`. If `directedTutorId`: verify it is a real `STUDENT_TUTOR` with a `TutorProfile`; set `directedTutorProfileId`; in the same `$transaction` create a `Notification` (`TOPIC_REQUEST_DIRECTED`, link `/tutor/requests`) for that tutor. Topic-in-subject check + `OPEN` cap (10) unchanged. |
| `api/learner/topic-requests/route.ts` | `GET` | Caller's own, all statuses, newest first. Add `directedTo: { anonymousId } | null` and `fulfilledClass` summary to each row. |
| `api/learner/topic-requests/[id]/route.ts` | `PATCH` | `cancelTopicRequestSchema`. Allowed from `OPEN` **or** `ACCEPTED` (was `OPEN` only). On cancel from `ACCEPTED`, null `fulfilledClassId` (class kept). |
| `api/tutor/topic-requests/route.ts` | `GET` | Query `tab=open|accepted` (default `open`), `subject?`, `page`, `pageSize`. `open` → `topicRequestVisibility.tutorPoolWhere(...)`, directed rows flagged `directed: true` and sorted first. `accepted` → `status in (ACCEPTED, ENROLLED)` AND `fulfilledClass.tutorProfileId = me`, include the linked class (id, next session, enrollment count) + its request status. Learner anonymized (`anonymousId, gradeLevel, section`). |
| `api/tutor/topic-requests/[id]/accept/route.ts` | `POST` (**replaces** `/fulfill`) | Body `acceptTopicRequestSchema` (= `createClassSchema`). Request must be `OPEN` and pass `tutorPoolWhere` for this tutor (`403` otherwise). `subject` must equal the request's. **Every submitted class topic must have a `CERTIFIED` cert for this tutor** (hard rule, regardless of `requireCertificationForClassCreation`). Run the same past-date + `hasInternalOverlap` + `hasSessionOverlap` (`src/lib/classSessions.ts`) checks as `POST /api/tutor/classes`. In one `$transaction`: create the `TutorClass` (+topics+sessions, `published: true`), set request `status = ACCEPTED` + `fulfilledClassId`, `notify` the learner (`TOPIC_REQUEST_ACCEPTED`, link `/learner/classes/<id>`). Return `{ request, classId }`. |
| `api/classes/[classId]/enroll/route.ts` | `POST` | After `classEnrollment.create`: `updateMany` `TopicRequest` where `fulfilledClassId = classId, learnerId = me, status = "ACCEPTED"` → `ENROLLED`. |
| `api/classes/[classId]/enroll/route.ts` | `DELETE` | After delete: `updateMany` where `... status = "ENROLLED"` → `ACCEPTED`. |
| `api/tutor/classes/[classId]/route.ts` | `PATCH` | Inside the existing status-cascade `$transaction`: if new status `COMPLETED` → linked `ACCEPTED/ENROLLED` requests → `FULFILLED` + notify (`TOPIC_REQUEST_FULFILLED`). If `CANCELLED` → linked requests → `OPEN`, null `fulfilledClassId`, notify (`TOPIC_REQUEST_REOPENED`). |
| `api/tutor/classes/[classId]/route.ts` | `DELETE` | Before deleting: re-open (`→ OPEN`, unlink, notify) any linked `ACCEPTED` request. |
| `api/admin/classes/[classId]/route.ts` | `PATCH` | When admin sets a class to `BANNED`: re-open linked non-terminal requests (`→ OPEN`, unlink, notify). |
| `api/admin/topic-requests/route.ts` | `GET` | `ADMIN` only. Paginated like `api/admin/classes`. Filters: `q` (learner first/last/anonymousId, topic text), `status`, `subject`, `scope=public|directed`. Each row: request + learner (`anonymousId` + real name, admin accountability view) + `directedTutor.anonymousId` + `fulfilledClass` summary. |
| `api/admin/topic-requests/[id]/route.ts` | `PATCH` | Body `moderateTopicRequestSchema`. `→ CANCELLED` from any non-terminal state, or `→ OPEN` from `CANCELLED`/`ACCEPTED`. Null `fulfilledClassId`. Write `AuditLog` (`TOPIC_REQUEST_STATUS_CHANGE` / `TOPIC_REQUEST`) in the same `$transaction`. |
| `api/notifications/route.ts` | `GET` | Caller's notifications, newest first, cap 50 → `{ notifications, unreadCount }`. |
| `api/notifications/read/route.ts` | `POST` | Body `{ ids?: string[] }` — no ids = mark all caller's read. → `{ unreadCount }`. |

Delete `api/tutor/topic-requests/[id]/fulfill/route.ts` and its test.

---

## UI

### Notifications (shared)
- **`src/components/layout/PortalLayout.tsx`** — `NavItem` gains `badge?: number`; render
  `<span className="badge badge-error badge-xs">` after the label when `badge > 0`.
- **`src/app/learner/layout.tsx`** & **`src/app/tutor/layout.tsx`** (async server components) —
  `prisma.notification.count({ where: { userId, readAt: null } })`; add a **"Notifications"** nav
  item (`Bell` icon) carrying that as `badge`.
- **`src/app/{learner,tutor}/notifications/page.tsx`** — thin, render `<NotificationList />`.
- **`src/components/notifications/NotificationList.tsx`** (`"use client"`) — fetch
  `/api/notifications`; list rows (icon by `type`, message, relative time, unread dot); each row
  is a `<Link href={link}>`; "Mark all read" button + auto-`POST /api/notifications/read` on mount.

### Learner
- **`src/components/learner/TopicRequestManager.tsx`** — per-row status handling for the new
  states: `ACCEPTED` → prominent "A class was created — Review & enroll" (link to
  `/learner/classes/<fulfilledClass.id>`) + Cancel; `ENROLLED` → "Enrolled — class in progress";
  `FULFILLED` → muted "Completed"; show `Directed to TUT-XXXX` vs `Public` badge on each card.
- **`src/components/learner/RequestTopicButton.tsx`** (new, `"use client"`) — on
  `src/app/learner/tutors/[tutorId]/page.tsx`: "Request a topic from this tutor" → modal with
  `MatchCriteriaFields` + note, `POST /api/learner/topic-requests` with `directedTutorId`.
  Subject/topics optionally constrained to the tutor's verified topics.

### Tutor
- **`src/app/tutor/requests/page.tsx`** + **`src/components/tutor/TopicRequestBrowser.tsx`**
  (renamed from `TopicRequestQueue`, `"use client"`) — two tabs (`Tabs` component):
  - **Open to me** — `tab=open`; directed rows pinned with a "Directed to you" badge; each row has
    an **Accept & create class** button → `AcceptRequestModal`.
  - **Accepted by me** — `tab=accepted`; shows the linked class, its next session, enrollment
    count, and request status (`Awaiting enrollment` / `Enrolled`); link to the class page.
  - `usePaginatedList` per tab (bespoke fetch if it needs the `directed` flag / class summary).
- **`src/components/tutor/AcceptRequestModal.tsx`** (new) — wraps `ClassScheduleFields`
  pre-filled from the request (subject **locked**, topics pre-checked to the request's topics ∩
  tutor's certified topics, `gradeLevel` pre-set, description seeded from the note, first session
  date pre-filled from the request's first preferred slot → next occurrence). Submits to
  `POST /api/tutor/topic-requests/[id]/accept`; on success navigates to the new class page.
  Certified-topic gating shown inline (uncheckable topics the tutor isn't certified for).
- Delete `src/components/tutor/FulfillRequestModal.tsx`.
- **`src/app/tutor/page.tsx`** dashboard stat — keep the "Open topic requests" count, scope it to
  `tutorPoolWhere` (things this tutor can actually act on) and link to `/tutor/requests`.

### Admin
- **`src/app/admin/layout.tsx`** — add **"Topic Requests"** nav item (`Inbox` icon) →
  `/admin/topic-requests`.
- **`src/app/admin/topic-requests/page.tsx`** + **`src/components/admin/TopicRequestModerationTable.tsx`**
  — mirror `/admin/classes` + `ClassModerationTable`: filters (search, status, subject, scope),
  paginated table (learner, subject, topics, status, directed-to, linked class), row actions
  **Close** (`→ CANCELLED` + reason) and **Re-open** (`→ OPEN`), calling
  `PATCH /api/admin/topic-requests/[id]`.
- **`src/app/admin/page.tsx`** — add an "Open topic requests" stat.

### Seed
- `prisma/seed.ts` generator — make a share of generated requests **directed**; set a few to
  `ACCEPTED`/`ENROLLED` with a real linked class so the tutor "Accepted by me" tab and the admin
  page have data. Emit sample `Notification` rows for the demo learner/tutor.

---

## Tests (Vitest — `__tests__/`, `vi.hoisted` + mock `@/lib/prisma` & `next-auth`)

- `api/learner/topic-requests` — `directedTutorId` path creates the request **and** a notification;
  invalid `directedTutorId` → `400`; cancel allowed from `ACCEPTED` (nulls `fulfilledClassId`).
- `api/tutor/topic-requests` — `tab=open` visibility (public filtered by certified topics; directed
  only to the target; directed flag + ordering); `tab=accepted` scoping.
- `api/tutor/topic-requests/[id]/accept` — uncertified topic → `403`/`400`; subject mismatch →
  `400`; request not `OPEN` → `400`; time conflict → `409`; happy path → class created, request
  `ACCEPTED` + `fulfilledClassId`, learner notification created, **no enrollment**.
- `api/classes/[classId]/enroll` — `ACCEPTED → ENROLLED` on enroll; `ENROLLED → ACCEPTED` on
  unenroll (assert the `updateMany` where-clause).
- `api/tutor/classes/[classId]` PATCH — `COMPLETED` → linked request `FULFILLED` + notification;
  `CANCELLED` → linked request `OPEN`, `fulfilledClassId` null, notification.
- `api/admin/topic-requests` — `401` non-admin; `GET` filters; `PATCH` close/re-open writes
  `AuditLog`; `403`/validation guards.
- `api/notifications` + `/read` — GET returns only caller's with `unreadCount`; `read` with no ids
  marks all; with ids marks those.
- Update the removed-`fulfill` test; keep all current suites green.

## Docs
- `docs/roles/LEARNER.md` — public vs directed requests, the full status lifecycle table, the
  "Request a topic from this tutor" entry point, Notifications page + API.
- `docs/roles/TUTOR.md` — `/tutor/requests` two tabs, **Accept → creates a class** (certification
  required), what makes a request re-open, Notifications page + API.
- `docs/roles/ADMIN.md` — `/admin/topic-requests` moderation (close / re-open), audit action,
  `GET`/`PATCH` API.

---

## Verification

1. `npx prisma migrate dev --name topic_requests_directed_and_notifications` + `npx prisma generate`
   (after user confirms); re-run `pnpm exec tsx prisma/seed.ts`.
2. `pnpm exec tsc --noEmit` • `pnpm lint` • `pnpm test` — all green.
3. `pnpm dev` walkthrough:
   - Learner → tutor profile (`/learner/tutors/<id>`) → "Request a topic from this tutor" → post.
     Tutor gets a **Notifications** badge; the request shows only under that tutor's "Open to me".
   - Learner → `/learner/requests` → post a **public** request in a subject several seeded tutors
     are certified in → it appears in each of their "Open to me" tabs, not others'.
   - Tutor → `/tutor/requests` → **Accept & create class** (full form pre-filled; a topic the
     tutor isn't certified for can't be checked) → class created; learner gets a notification;
     request moves to **Accepted by me** / learner sees "Review & enroll".
   - Learner enrolls → request disappears from every pool (status `ENROLLED`); unenroll → it comes
     back to the learner's "enroll now" state.
   - Tutor cancels the class → request re-opens (learner notified); tutor completes the class →
     request `FULFILLED` (learner notified), gone from the pool.
   - Admin → `/admin/topic-requests` → filter by directed/public/status; **Close** a request →
     `CANCELLED` + audit-log entry at `/admin/audit-log`; **Re-open** → back to `OPEN`.
