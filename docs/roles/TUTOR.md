# STUDENT_TUTOR Role

The `STUDENT_TUTOR` role lets a student offer peer tutoring sessions to other students. Tutors access the `/tutor` portal. Every tutor has a `TutorProfile` created automatically at registration.

Source: `src/app/tutor/**`, `src/app/api/tutor/**`, `src/components/tutor/**`

---

## Registration

- **Register as a tutor** — sign up with first/last name, email, password, grade level, section, optional contact info, and consent. A `TutorProfile` is created in the same transaction as the `User`. Only accepted while `registrationOpen` platform setting is `true`.
  (`POST /api/register`)
- Receives a sequential anonymous ID in the form `TUT-XXXX`, generated atomically via `generateAnonymousId("TUTOR")`.

## Class Management (`/tutor/classes`)

A `TutorClass` is a **course container** (subject, topics, description, capacity, meeting link, one enrollment roster) that can hold multiple **sessions** — individual meetings at different days/times, each tackling one topic. This lets a tutor run a multi-part course (e.g. Tue: Fractions, Thu: Ratios) as a single class with one roster, and add the next meeting later instead of creating a whole new class every time.

- **View own classes** — list all classes the tutor has created, optionally filtered by status; includes each class's topics, all of its sessions, and the roster of enrolled learners (learners are shown only by anonymized info: ID, grade level, section — never real name/email).
  (`GET /api/tutor/classes`)
- **Create a class** — choose a subject, one or more topics (validated against the subject's predefined topic list), description, max student capacity, optional meeting link, and **one or more initial sessions** (each with a topic drawn from the class's topics, a date/time, and a duration).
  - Every session's topic must be one of the class's selected topics.
  - Blocked from scheduling any session in the past.
  - Blocked if the submitted sessions overlap each other, or overlap any of the tutor's existing sessions across any of their other classes (conflict detection).
  - If `requireCertificationForClassCreation` is enabled platform-wide, every selected topic must have a `CERTIFIED` `TopicCertification` for that tutor, or the request is rejected.
  (`POST /api/tutor/classes`)
- **Add a session to an existing class** — schedule the next meeting without recreating the class; only allowed while the class is `SCHEDULED`. Same topic/past-date/overlap validation as creation.
  (`POST /api/tutor/classes/[classId]/sessions`)
- **Reschedule or change the status of a single session** — update its topic/date/duration, or mark it `COMPLETED`/`CANCELLED`/`SCHEDULED` independently of sibling sessions.
  (`PATCH /api/tutor/classes/[classId]/sessions/[sessionId]`)
- **Delete a session** — only a `SCHEDULED` session can be deleted. Deleting the class's last remaining session is blocked while learners are enrolled (cancel or delete the whole class instead); with zero enrollments it's allowed, leaving the class as an editable shell.
  (`DELETE /api/tutor/classes/[classId]/sessions/[sessionId]`)
- **Edit the class itself** — update topics/description/capacity/meeting link, or manually set the whole class's status to `SCHEDULED`, `COMPLETED`, or `CANCELLED`. Subject is fixed after creation (changing it would invalidate the topics/sessions already tied to it).
  - Only the owning tutor may edit; a class suspended or banned by an admin cannot be modified.
  - Capacity cannot be reduced below the current enrollment count.
  - A topic cannot be removed from the class while one of its sessions still uses that topic.
  - Setting the class to `CANCELLED` or `COMPLETED` **cascades**: every still-`SCHEDULED` session is bulk-updated to match, in the same transaction.
  (`PATCH /api/tutor/classes/[classId]`)
- **Publish / unpublish a class** — toggle whether a `SCHEDULED` class is visible to learners for browsing/enrollment, without touching its sessions or existing enrollments. An unpublished class shows as "Draft" to the tutor.
  (`PATCH /api/tutor/classes/[classId]` with `{ "published": boolean }`)
- **Delete a class** — only allowed if no learners are enrolled; otherwise the tutor must cancel instead of delete. Cascade-deletes all of its sessions.
  (`DELETE /api/tutor/classes/[classId]`)
- **View class details** — clicking a class opens a dedicated fullscreen detail page (`/tutor/classes/[classId]`, server-rendered directly from Prisma with an ownership check — 404s if the class doesn't belong to the requesting tutor), showing the full session list (with per-session reschedule/complete/cancel/delete controls and an Add Session action), description, and enrolled learners' roster (anonymized — `anonymousId`, grade level, section only). A **Manage Class** menu (top-right, next to the back link) groups Edit Class Info, Publish/Unpublish, Finish Class, Cancel Class, and (when eligible) Delete Class — kept behind one menu instead of standing buttons so destructive actions aren't one accidental click away.
- **View a student's profile** — clicking a learner in the roster (on this page or on the Students page below) opens a dedicated fullscreen page (`/tutor/students/[studentId]`, server-rendered from Prisma; 404s unless that learner is enrolled in one of the requesting tutor's classes): `anonymousId`, grade level, section, and the full breakdown of every class/subject/topic they're enrolled in **with this tutor** (each row links to that class). Still never shows real name, email, or contact info.

## Students (`/tutor/students`)

- **View your student roster** — every distinct learner enrolled in any of your classes, aggregated across classes, anonymized (`anonymousId`, grade level, section only), with the subjects/topics/enrollment dates for each of their enrollments with you.
  (`GET /api/tutor/students`)
- Filterable by grade level, section (free-text), subject, and a specific `classId`. Paginated.
- **Click a row to view that student's profile** — the same fullscreen `/tutor/students/[studentId]` page described under Class Management above, showing their full cross-class enrollment breakdown with this tutor.

## Topic Requests (`/tutor/requests`)

- **View open topic requests** — learners' `OPEN` requests for help on a topic, anonymized (`anonymousId`, grade level, section only). Each shows the subject, requested topics, preferred weekly time windows, an optional note, and when it was posted. Paginated.
  (`GET /api/tutor/topic-requests`)
- Filterable by `subject`; by default the list is scoped to subjects the tutor teaches (has a class in) or holds any `TopicCertification` for. Pass `mine=false` (or pick an explicit subject) to see all open requests.
- **Respond by attaching a class** — pick one of your `SCHEDULED` classes in the same subject; the request flips to `FULFILLED` and links that class. The learner is **not** enrolled — they get a "Review & enroll" prompt and choose for themselves. If you have no suitable class, create one first from `/tutor/classes`.
  (`POST /api/tutor/topic-requests/[id]/fulfill`)
- The tutor dashboard (`/tutor`) shows the count of open requests with a link here.
- Gated by the `matchingEnabled` platform setting.

## Assessments (`/tutor/assessments`)

- **Request a topic assessment/certification** — submit a request for a specific `subject` + `topic` pair (must belong to the subject's predefined topic list). Creates/upserts a `PENDING` `TopicCertification`; re-requesting an already-requested topic is idempotent (no duplicate).
  (`POST /api/tutor/topic-certifications`)
- **View own certification requests and statuses** — list of all certifications requested by the tutor (`PENDING` or `CERTIFIED`), each with `requestedAt`/`certifiedAt` timestamps and which of the tutor's own classes currently use that topic (`usedInClasses`).
  (`GET /api/tutor/topic-certifications`)
- Certifications are reviewed and approved/rejected by an **ADMIN** (see [[admin-role]]); the tutor cannot self-approve.
- Being `CERTIFIED` in a topic is what unlocks teaching it when `requireCertificationForClassCreation` is enabled, and is surfaced to learners in the class browser as a "verified topic" signal.
- The dashboard (`/tutor`) shows only a summary (verified/pending counts with a link) — the full request UI and history live on this dedicated page.

## Availability (`/tutor/availability`)

- **Manage your weekly availability** — define/replace a full set of weekly time slots (day + start/end time), one save replaces the tutor's entire set.
  (`GET`/`PUT /api/tutor/availability`)
- No overlapping slots allowed on the same day.
- **Informational only** — not yet surfaced to learners during class browsing, and not enforced during class scheduling. A future enhancement.

## Profile (`/tutor/profile`)

- **View own account info** — real name, email, anonymous ID (`TUT-XXXX`), and role. Always read-only.
- **Edit `contactInfo` and `section`** — the only two self-service editable fields.
  (`PATCH /api/tutor/profile`)
- Name, email, password, and grade level are **not** self-editable: email/password changes need a dedicated, security-sensitive flow (not yet built); name changes are avoided since the session's cached `fullName` only refreshes on next login and this is an anonymity-sensitive platform; grade level is admin-managed since it feeds grade/section filters elsewhere (e.g. the Students roster, admin user tables).

## Privacy & Identity

- Tutors never see a learner's real name, email, or contact info — only `anonymousId`, grade level, and section, enforced by `select`-scoped Prisma queries on the roster endpoint.
- A tutor's own real identity is visible only to themself and to admins (for moderation).

## API Reference

### `POST /api/register`
Register a new tutor account. No auth required. `403 { error: "Registration is currently closed." }` when the `registrationOpen` platform setting is `false`.

**Body**
```json
{
  "type": "TUTOR",
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
- Creates the `User` (role `STUDENT_TUTOR`) and an empty `TutorProfile` in one transaction; generates a sequential `TUT-XXXX` anonymous ID via `generateAnonymousId("TUTOR")`.

**201** → `{ message, anonymousId }`.
**400** → validation error (first Zod issue message).
**403** → registration closed.
**409** → `{ error: "An account with this email already exists." }`.
**500** → `{ error }`.

### `GET /api/tutor/classes`
List the authenticated tutor's own classes. Requires `role === "STUDENT_TUTOR"` (else `401`); `404` if no `TutorProfile` exists.

**Query params**: `status` (optional, `ClassStatus` enum) — filters the list.

**200** → array of `TutorClass`, each with `topics: string[]`, `sessions: [{ id, topic, scheduledAt, duration, status }]` (ordered by `scheduledAt` ascending), and `enrollments: [{ ...enrollment, learner: { id, anonymousId, gradeLevel, section } }]` (anonymized — no real name/email). Ordered by `createdAt` descending.
**500** → `{ error }`.

### `POST /api/tutor/classes`
Create a new class with its initial session(s).

**Body**
```json
{
  "subject": "SubjectArea enum",
  "gradeLevel": "GradeLevel enum (optional, null = open to any grade)",
  "topics": ["string", "... (1–10 items, each non-empty)"],
  "description": "string (≤500 chars, optional)",
  "maxStudents": "int (1–10)",
  "meetingLink": "string (valid URL, optional)",
  "sessions": [
    { "topic": "string", "scheduledAt": "ISO datetime string", "duration": "int minutes (15–240)" }
  ]
}
```
- `sessions` requires 1–20 entries.
- Every topic in `topics` must belong to `SUBJECT_TOPICS[subject]`; every session's `topic` must be one of the submitted `topics`.
- If `requireCertificationForClassCreation` is on, every topic in `topics` must have a `CERTIFIED` `TopicCertification` for this tutor.
- No session may be scheduled in the past.
- Rejected if two or more submitted sessions overlap each other, or if any session overlaps one of the tutor's existing `SCHEDULED` sessions in any of their other classes.

**201** → created `TutorClass` (`topics` as `string[]`, plus `sessions`).
**400** → invalid topics/session topics/uncertified topics/past date/validation error.
**401** → not a tutor. **404** → no tutor profile.
**409** → `{ error: "Time conflict detected: ..." }` (self-overlap among submitted sessions, or overlap with an existing session).
**500** → `{ error }`.

### `POST /api/tutor/classes/[classId]/sessions`
Add a new session to an existing class — the way to schedule the next meeting without recreating the class.

**Body**
```json
{ "topic": "string", "scheduledAt": "ISO datetime string", "duration": "int minutes (15–240)" }
```
- `topic` must be one of the class's existing topics.
- Only allowed while the class's own `status === "SCHEDULED"`.
- Same past-date and cross-class overlap checks as class creation.

**201** → the created `ClassSession`.
**400** → class not `SCHEDULED`, invalid topic, past date, or validation error.
**401** → not a tutor. **403** → not the owner, or class suspended/banned. **404** → class not found.
**409** → time conflict.
**500** → `{ error }`.

### `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]`
Reschedule a session and/or change its status, independent of sibling sessions.

**Body** (partial)
```json
{ "topic": "string", "scheduledAt": "ISO datetime string", "duration": "int minutes (15–240)", "status": "SCHEDULED" | "COMPLETED" | "CANCELLED" }
```
- If the resulting status is (or stays) `SCHEDULED`, past-date and cross-class overlap checks run against the effective date/duration (excluding this session itself).

**200** → the updated `ClassSession`.
**400** → invalid topic/status/past date, or validation error.
**401** → not a tutor. **403** → not the owner, or class suspended/banned. **404** → class or session not found.
**409** → time conflict.
**500** → `{ error }`.

### `DELETE /api/tutor/classes/[classId]/sessions/[sessionId]`
Delete a single session.

**200** → `{ message: "Session deleted successfully." }`.
**400** → `{ error: "Cannot delete a completed or cancelled session; its record is kept for history." }`, or `{ error: "Cannot delete the only session of a class with enrolled learners — cancel or delete the whole class instead." }`.
**401** → not a tutor. **403** → not the owner, or class suspended/banned. **404** → class or session not found.
**500** → `{ error }`.

### `PATCH /api/tutor/classes/[classId]`
Edit the class itself (partial update — subject/gradeLevel/topics/description/maxStudents/meetingLink/`published`, plus `status`; sessions are managed via their own endpoints above). `gradeLevel` accepts a `GradeLevel` enum or `null` (clears the target grade).

**Body** (any subset of the class-detail fields, including `published: boolean`) plus optionally:
```json
{ "status": "SCHEDULED" | "COMPLETED" | "CANCELLED" }
```
- Only the owning tutor may edit (`403` otherwise); a `SUSPENDED`/`BANNED` class cannot be edited (`403`).
- `maxStudents` cannot drop below current enrollment count (`400`).
- Setting `status` to `CANCELLED` or `COMPLETED` cascades: every still-`SCHEDULED` session for this class is bulk-updated to match, in the same transaction.
- Supplying `topics` replaces the full topic set (`deleteMany` + recreate) — rejected (`400`) if any removed topic is still used by one of the class's sessions.
- Supplying `published` toggles learner-facing visibility without touching sessions/enrollments/status.

**200** → updated `TutorClass` (with `sessions`).
**400** → invalid status/capacity/validation error.
**403** → not the owner, or class is suspended/banned.
**404** → class not found.
**500** → `{ error }`.

### `DELETE /api/tutor/classes/[classId]`
Delete an owned class. Only allowed with zero enrollments. Cascade-deletes its sessions.

**200** → `{ message: "Class deleted successfully." }`.
**400** → `{ error: "Cannot delete a class that has enrolled learners. Please cancel the class instead." }`.
**403** → not the owner. **404** → class not found.
**500** → `{ error }`.

### `GET /api/tutor/topic-certifications`
List the authenticated tutor's own certification requests (`PENDING` or `CERTIFIED`), newest-requested-first.

**200** → array of `{ ...TopicCertification, usedInClasses: [{ id, subject, scheduledAt, status }] }` — `usedInClasses` lists the tutor's own classes whose subject+topic matches this certification (empty array if none).
**401** → not a tutor. **404** → no tutor profile.
**500** → `{ error }`.

### `POST /api/tutor/topic-certifications`
Request/upsert a certification for a subject + topic pair.

**Body**
```json
{ "subject": "SubjectArea enum", "topic": "string (required)" }
```
- `topic` must belong to `SUBJECT_TOPICS[subject]`.
- Upserts on the `(tutorProfileId, subject, topic)` unique key — re-requesting is idempotent (no duplicate row; existing status untouched).

**201** → the `TopicCertification` (new or existing).
**400** → invalid topic for subject, or validation error.
**401** → not a tutor. **404** → no tutor profile.
**500** → `{ error }`.

### `GET /api/tutor/students`
Aggregate roster of every distinct learner enrolled in any of the tutor's classes.

**Query params** (all optional): `page` (default `1`), `pageSize` (default `10`, max `100`), `gradeLevel` (`GradeLevel` enum), `section` (free-text, `contains`), `subject` (`SubjectArea` enum), `classId`.

**200** → `{ students: [{ id, anonymousId, gradeLevel, section, enrollments: [{ classId, subject, topics: string[], enrolledAt }] }], total, page, pageSize }` — anonymized, no real name/email/contactInfo. Pagination is applied over distinct learners (grouped in application code), not raw enrollment rows.
**401** → not a tutor. **404** → no tutor profile.
**500** → `{ error }`.

### `GET /api/tutor/availability`
List the tutor's weekly availability slots, ordered by day then start time.

**200** → array of `{ id, day, startTime, endTime }`.
**401** → not a tutor. **404** → no tutor profile.
**500** → `{ error }`.

### `PUT /api/tutor/availability`
Replace the tutor's entire weekly slot set in one transaction.

**Body**
```json
{ "slots": [{ "day": "MONDAY", "startTime": "09:00", "endTime": "10:00" }] }
```
- `day` is one of the 7 weekday names. `startTime`/`endTime` are `HH:MM` (24h), `startTime` must be before `endTime`. Slots on the same day must not overlap. Up to 50 slots.
- Deletes all existing slots and recreates from the submitted set (empty array clears everything).

**200** → the replaced array of `{ id, day, startTime, endTime }`.
**400** → invalid day/time format/ordering/overlap, or validation error.
**401** → not a tutor. **404** → no tutor profile.
**500** → `{ error }`.

### `PATCH /api/tutor/profile`
Update the tutor's own self-service profile fields.

**Body** (partial)
```json
{ "contactInfo": "string (≤200 chars, optional)", "section": "string (1–50 chars, optional)" }
```
- Updates by the session's own user id — no ownership-check surface, so no `403`/`404`/`409`.

**200** → `{ contactInfo, section }` (only these two fields — never echoes email/name).
**400** → validation error.
**401** → not a tutor.
**500** → `{ error }`.

### `GET /api/tutor/topic-requests`
List `OPEN` learner topic requests. Requires `role === "STUDENT_TUTOR"` (`401`); `404` if no `TutorProfile`; `403` when `matchingEnabled` is off.

**Query params** (all optional): `subject` (`SubjectArea` enum), `mine` (default `"true"` — scope to subjects the tutor teaches or is certified for; `"false"` for all), `page` (default `1`), `pageSize` (default `10`, max `100`).

**200** → `{ requests: [{ id, subject, gradeLevel, note, createdAt, topics: string[], slots: [{ day, startTime, endTime }], learner: { anonymousId, gradeLevel, section } }], total, page, pageSize }` — anonymized, no real name/email.
**500** → `{ error }`.

### `POST /api/tutor/topic-requests/[id]/fulfill`
Attach one of the tutor's classes to an `OPEN` request. Does **not** enroll the learner.

**Body**: `{ "classId": "string" }`.
- The class must belong to the caller, be `SCHEDULED`, and share the request's `subject`.
- The request must be `OPEN`.

**200** → `{ id, status: "FULFILLED", fulfilledClassId }`.
**400** → request not open, class not scheduled, subject mismatch, or validation error.
**401** → not a tutor. **403** → class isn't the caller's, or matching disabled. **404** → request or tutor profile not found.
**500** → `{ error }`.

## What Tutors Cannot Do

- Cannot browse or enroll in classes (that's the learner's role).
- Cannot approve their own certification requests.
- Cannot modify a class once an admin has suspended or banned it.
- Cannot reduce a class's capacity below its current enrollment count.
- Cannot add a session to a class that isn't currently `SCHEDULED`.
- Cannot delete a `COMPLETED`/`CANCELLED` session, or delete a class's last remaining session while learners are enrolled.
- Cannot change a class's subject after creation, or remove a topic that's still used by one of its sessions.
- Cannot self-edit name, email, password, or grade level — only `contactInfo` and `section` are self-service.
- Cannot see a learner's real name, email, or contact info anywhere, including the Students roster (anonymized only).
