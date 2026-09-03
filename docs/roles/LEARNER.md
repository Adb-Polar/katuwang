# STUDENT_LEARNER Role

The `STUDENT_LEARNER` role lets a student browse and join peer tutoring sessions offered by tutors. Learners access the `/learner` portal.

Source: `src/app/learner/**`, `src/app/api/classes/**`, `src/components/learner/**`

---

## Registration

- **Register as a learner** — sign up with first/last name, email, password, grade level, section, optional contact info, and consent. Only accepted while the `registrationOpen` platform setting is `true`.
  (`POST /api/register`)
- Receives a sequential anonymous ID in the form `STU-XXXX`, generated atomically via `generateAnonymousId("LEARNER")`.

## Class Browsing (`/learner/classes`) and My Classes (`/learner/my-classes`)

A class (`TutorClass`) is a course that can span multiple **sessions** — individual meetings at different days/times, each covering one topic. Enrollment is always whole-class: one enrollment covers every session.

The two lists are separate sidebar pages, both backed by `GET /api/classes` (paginated, 12/page, `?scope=browse|mine&page=`):

- **Browse Classes** (`/learner/classes`, `scope=browse`) — every `SCHEDULED` + **published** class with at least one upcoming `SCHEDULED` session that the learner is **not** already enrolled in. A tutor can unpublish a class to hide it here without cancelling it. Expired suspensions are auto-reinstated (`reinstateExpiredClasses`) before results are returned.
- **My Classes** (`/learner/my-classes`, `scope=mine`) — every class the learner is enrolled in, regardless of status (upcoming, completed, cancelled, unpublished).
- The response also returns `counts: { browse, mine }` so each page can show its total.
- Each listing shows: subject, topics, description, all of its sessions, capacity/enrollment count, meeting link, and the tutor's anonymized identity (`anonymousId` only — never real name/email). The class card surfaces the next upcoming session's date/time plus a total session count.
- **Verified topics** — topics the teaching tutor holds a `CERTIFIED` `TopicCertification` for are flagged separately, letting learners identify vetted tutors for a given topic.
- **View class details** — clicking a class opens a dedicated fullscreen detail page (`/learner/classes/[classId]`, server-rendered directly from Prisma — 404s unless the class is currently browsable or the learner is enrolled in it), showing the full session list (read-only — date, topic, duration, status per session), description, and the tutor's anonymized ID.
- **View the tutor's profile** — clicking the tutor's anonymous ID badge opens a dedicated fullscreen page (`/learner/tutors/[tutorId]`, server-rendered from Prisma — 404s if the id isn't a tutor): their `anonymousId`, their verified (`CERTIFIED`) topics grouped by subject, and **every one of their `published` classes** as clickable cards (each links to that class's detail page). Never shows real name, email, or contact info.
- **Request a topic from this tutor** — a "Request a topic from this tutor" button on that same profile page opens the same criteria form used on `/learner/requests`, but submits with `directedTutorId` set so the request is **directed**: only that tutor sees it (see Topic Requests below).

## Enrollment (`/learner/classes/[classId]`)

- **Enroll in a class** — join a `SCHEDULED` class that has at least one upcoming `SCHEDULED` session and still has open seats. Enrolling joins the whole course, not an individual session.
  - Blocked if the class isn't `SCHEDULED`, has no upcoming session, is full, or the learner is already enrolled.
  (`POST /api/classes/[classId]/enroll`)
- **Unenroll from a class** — leave a class the learner is currently enrolled in, as long as it's still `SCHEDULED` (can't unenroll from a completed/cancelled class). Unenrolling is whole-class regardless of individual session states — you can't unenroll from just one session, since later sessions build on earlier ones.
  (`DELETE /api/classes/[classId]/enroll`)

## Automatic Matching (`/learner/match`)

- **Find a class** — describe what you need (subject, one or more topics, an optional grade level, and any number of preferred weekly time windows) and get a ranked list of open, browsable classes that fit. Enrolling still happens through the normal class detail page — matching only ranks, it never enrolls.
  (`POST /api/learner/match`)
- Ranking is class-first (never a bare tutor): a class scores on how many requested topics it covers, whether the tutor is `CERTIFIED` for those topics, how many of its upcoming sessions land inside your preferred windows, how close its target grade is to yours, and how soon the next session is. Classes in the wrong subject, already full, unpublished, or with no upcoming session are dropped, as are classes you're already enrolled in.
- Grade level is prefilled from your profile; change it if you're looking for help at a different level.
- Gated by the `matchingEnabled` platform setting — when an admin turns it off, the endpoint returns `403`.

## Topic Requests (`/learner/requests`)

- **Post a topic request** — when nothing fits, record what you want to learn: subject, topics (validated against the subject's topic list), grade level, optional preferred time windows, and an optional note. A request is either:
  - **Public** (default) — every tutor certified in at least one of your requested topics can see it.
  - **Directed** — submit with `directedTutorId` (or use "Request a topic from this tutor" on a tutor's profile page) so only that one tutor sees it. That tutor gets a notification.
  (`GET`/`POST /api/learner/topic-requests`)
- Up to 10 `OPEN` requests at a time.
- **Status lifecycle** (`TopicRequestStatus`):

  | Status | Meaning | What you see |
  |---|---|---|
  | `OPEN` | Posted, unclaimed | "Waiting for a tutor" + Cancel |
  | `ACCEPTED` | A tutor accepted it and created a class for it | "A class was created — Review & enroll" + Cancel |
  | `ENROLLED` | You enrolled in that class | "Enrolled — class in progress" |
  | `FULFILLED` | The linked class was completed | "Completed" (terminal) |
  | `CANCELLED` | Withdrawn by you or closed by an admin | "Cancelled" (terminal) |

- **Cancel a request** — withdraw one of your own `OPEN` or `ACCEPTED` requests. The row is kept (status `CANCELLED`), not deleted. Cancelling an `ACCEPTED` request unlinks it from the class (`fulfilledClassId` cleared) but **the class itself is kept** — the tutor isn't forced to delete it.
  (`PATCH /api/learner/topic-requests/[id]` with `{ "status": "CANCELLED" }`)
- **When a tutor accepts your request** — they build a full class from it (subject/topics/schedule pre-filled), and the request flips to `ACCEPTED`, linked to that class. Your requests page shows a "Review & enroll" link to the class's detail page. You are **not** auto-enrolled — you decide. Enrolling flips the request to `ENROLLED`; unenrolling flips it back to `ACCEPTED`.
- **If the tutor cancels the linked class** — your request automatically re-opens (`→ OPEN`, unlinked) and you get a notification. **If the tutor completes the class** — your request is marked `FULFILLED` (terminal) and you get a notification.

## Notifications (`/learner/notifications`)

- A **Notifications** sidebar item (bell icon) shows an unread-count badge, sourced from `Notification` rows addressed to you.
- The page lists every notification, newest first (icon by type, message, relative time, unread dot), each linking to the relevant page (e.g. the class you can now enroll in). Visiting the page marks everything read; a "Mark all read" button does the same on demand.
- Notification types you'll see: `TOPIC_REQUEST_ACCEPTED` (a tutor built a class for your request), `TOPIC_REQUEST_REOPENED` (a linked class was cancelled, or an admin closed/re-opened your request), `TOPIC_REQUEST_FULFILLED` (a linked class completed).
  (`GET /api/notifications`, `POST /api/notifications/read`)

## Profile (`/learner/profile`)

- **View own account info** — real name, email, anonymous ID (`STU-XXXX`), and role. Always read-only.
- **Edit `contactInfo` and `section`** — the only two self-service editable fields.
  (`PATCH /api/learner/profile`)
- Name, email, password, and grade level are **not** self-editable (same rationale as the tutor profile): email/password changes need a dedicated security flow (not yet built); name changes are avoided on an anonymity-sensitive platform where the session's cached `fullName` only refreshes on next login; grade level is admin-managed because it feeds grade/section filters elsewhere.

## Privacy & Identity

- Learners never see a tutor's real name, email, or contact info — only the tutor's `anonymousId`.
- A learner's own real identity is visible only to themself and to admins (for moderation); tutors only ever see the learner's `anonymousId`, grade level, and section on their class roster.

## API Reference

### `POST /api/register`
Register a new learner account. No auth required. `403 { error: "Registration is currently closed." }` when the `registrationOpen` platform setting is `false`.

**Body**
```json
{
  "type": "LEARNER",
  "firstName": "string (1–50 chars)",
  "lastName": "string (1–50 chars)",
  "email": "string (valid email, lowercased)",
  "password": "string (min 8 chars)",
  "gradeLevel": "GradeLevel enum",
  "section": "string (required)",
  "contactInfo": "string (optional)",
  "consentGiven": true
}
```
- Creates the `User` (role `STUDENT_LEARNER`); generates a sequential `STU-XXXX` anonymous ID via `generateAnonymousId("LEARNER")`.

**201** → `{ message, anonymousId }`.
**400** → validation error (first Zod issue message).
**403** → registration closed.
**409** → `{ error: "An account with this email already exists." }`.
**500** → `{ error }`.

### `GET /api/classes`
Paginated class list for the learner. Requires `role === "STUDENT_LEARNER"` (else `401`). Runs `reinstateExpiredClasses()` first to lift any expired admin suspensions.

**Query params** (all optional): `scope` (`browse` | `mine`, default `browse`), `page` (default `1`), `pageSize` (default `12`, max `50`).
- `scope=browse` → `SCHEDULED` + **published** classes with an upcoming `SCHEDULED` session that the learner is **not** enrolled in.
- `scope=mine` → every class the learner is enrolled in, any status/published state.
- `q` (browse only) → matches the class **code**, any topic, or the tutor's anonymous ID (`contains`). `subject` / `gradeLevel` narrow further. Each class carries a `code` (`C-XXXX`).

**200**
```json
{
  "classes": [
    {
      "...TutorClass fields (id, subject, gradeLevel, description, maxStudents, meetingLink, status, published, ...)": "...",
      "topics": ["string"],
      "sessions": [{ "id": "string", "topic": "string", "scheduledAt": "ISO datetime", "duration": 0, "status": "SCHEDULED | COMPLETED | CANCELLED" }],
      "verifiedTopics": ["string (topics the tutor holds a CERTIFIED cert for, within this class's subject)"],
      "tutor": { "id": "string", "anonymousId": "string" },
      "_count": { "enrollments": 0 },
      "enrollments": [{ "id": "string" }]
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 0,
  "counts": { "browse": 0, "mine": 0 }
}
```
`total` is the count for the requested `scope`; `counts` carries both so each page can label its tab/header. `enrollments` per class is scoped to the requesting learner only.
**500** → `{ error }`.

### `POST /api/classes/[classId]/enroll`
Enroll in a class. Runs `reinstateExpiredClasses()` first.

**200/201** → `201` with the created `ClassEnrollment { id, classId, learnerId, enrolledAt }`.
**400** → class isn't `SCHEDULED`, or `{ error: "This class has no upcoming sessions to enroll in." }`.
**401** → not a learner.
**404** → class not found.
**409** → `{ error: "This class is already full." }` or `{ error: "You are already enrolled in this class." }`.
**500** → `{ error }`.

### `DELETE /api/classes/[classId]/enroll`
Unenroll from a class.

**200** → `{ message: "Unenrolled successfully." }`.
**400** → `{ error: "Cannot unenroll from a class that is already completed or cancelled." }`.
**401** → not a learner.
**404** → class not found, or `{ error: "You are not enrolled in this class." }`.
**500** → `{ error }`.

### `POST /api/learner/match`
Rank browsable classes against match criteria. Requires `role === "STUDENT_LEARNER"` (`401`). `403 { error: "Matching is currently unavailable." }` when `matchingEnabled` is off.

**Body**
```json
{
  "subject": "SubjectArea enum",
  "topics": ["string (1–10, each in SUBJECT_TOPICS[subject])"],
  "gradeLevel": "GradeLevel enum (optional)",
  "preferredSlots": [{ "day": "MONDAY", "startTime": "15:00", "endTime": "17:00" }]
}
```
- `preferredSlots` optional (max 21); `day` is one of the 7 weekday names, times are `HH:MM` 24h with `startTime < endTime`.

**200** → `{ "matches": [{ "class": <learner class DTO>, "score": number, "reasons": { "matchedTopics": string[], "verifiedMatchedTopics": string[], "scheduleFitCount": number, "gradeMatch": "exact" | "adjacent" | "any" | "none" } }] }` — best first, up to 20. `class` is the same anonymized shape as `GET /api/classes` entries (adds `gradeLevel`).
**400** → invalid topic for subject, or validation error. **401** → not a learner. **403** → matching disabled.
**500** → `{ error }`.

### `GET /api/learner/topic-requests`
List the caller's own topic requests, newest first.

**200** → array of `{ id, subject, gradeLevel, note, status, createdAt, topics: string[], slots: [{ day, startTime, endTime }], directedTo: { anonymousId } | null, fulfilledClass: { id, subject, nextSessionAt, tutorAnonymousId } | null }`. `status` is one of `OPEN | ACCEPTED | ENROLLED | FULFILLED | CANCELLED`.
**401** → not a learner.
**500** → `{ error }`.

### `POST /api/learner/topic-requests`
Create a topic request. `403` when `matchingEnabled` is off.

**Body**
```json
{
  "subject": "SubjectArea enum",
  "topics": ["string (1–10, each in SUBJECT_TOPICS[subject])"],
  "gradeLevel": "GradeLevel enum (required)",
  "preferredSlots": [{ "day": "MONDAY", "startTime": "15:00", "endTime": "17:00" }],
  "note": "string (≤500 chars, optional)",
  "directedTutorId": "string (optional — the tutor's User id; omit for a public request)"
}
```
- When `directedTutorId` is given, it must resolve to a real `STUDENT_TUTOR` with a `TutorProfile` (`400` otherwise); the request's `directedTutorProfileId` is set and that tutor gets a `TOPIC_REQUEST_DIRECTED` notification, in the same transaction as the create.

**201** → the created request (same shape as the GET entries).
**400** → invalid topic for subject, invalid `directedTutorId`, or validation error. **401** → not a learner. **403** → matching disabled.
**409** → `{ error }` when the learner already has 10 `OPEN` requests.
**500** → `{ error }`.

### `PATCH /api/learner/topic-requests/[id]`
Cancel one of the caller's own `OPEN` or `ACCEPTED` requests, or edit an `OPEN` request's criteria.

**Body**: `{ "status": "CANCELLED" }` to cancel — the only accepted value; edit uses the same body shape as `POST` (minus `directedTutorId`, which can't be changed after creation).
- Cancelling an `ACCEPTED` request nulls `fulfilledClassId` — the class the tutor created is **kept**, just unlinked.

**200** → `{ id, status }` (cancel) or the updated request (edit).
**400** → body invalid, the request is in a terminal state (cancel), or not `OPEN` (edit).
**401** → not a learner. **404** → request not found or not the caller's.
**500** → `{ error }`.

### `GET /api/notifications`
The caller's own notifications, newest first, capped at 50. Any authenticated role (not gated to learners).

**200** → `{ notifications: [{ id, type, message, link, readAt, createdAt }], unreadCount }`.
**401** → not authenticated.
**500** → `{ error }`.

### `POST /api/notifications/read`
Mark notifications read.

**Body**: `{ "ids"?: string[] }` — omitted/empty marks **all** of the caller's unread notifications read; otherwise only the given ids.

**200** → `{ unreadCount }`.
**401** → not authenticated.
**500** → `{ error }`.

### `PATCH /api/learner/profile`
Update the learner's own self-service profile fields. Requires `role === "STUDENT_LEARNER"` (`401`).

**Body** (partial)
```json
{ "contactInfo": "string (≤200 chars, optional)", "section": "string (1–50 chars, optional)" }
```
- Updates by the session's own user id — no ownership-check surface, so no `403`/`404`/`409`.
- An empty-string `contactInfo` clears the field (stored as `null`).

**200** → `{ contactInfo, section }` (only these two fields — never echoes email/name).
**400** → validation error (empty section, `contactInfo` too long).
**401** → not a learner.
**500** → `{ error }`.

## What Learners Cannot Do

- Cannot create, edit, or moderate classes (that's the tutor's and admin's role, respectively).
- Cannot request or view tutor topic certifications.
- Cannot enroll in a class that is full, unpublished, has no upcoming sessions, cancelled, suspended, or banned.
- Cannot unenroll from a single session — enrollment and unenrollment are always whole-class.
- Cannot see other learners enrolled in the same class.
