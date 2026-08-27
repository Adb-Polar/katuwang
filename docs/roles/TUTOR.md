# STUDENT_TUTOR Role

The `STUDENT_TUTOR` role lets a student offer peer tutoring sessions to other students. Tutors access the `/tutor` portal. Every tutor has a `TutorProfile` created automatically at registration.

Source: `src/app/tutor/**`, `src/app/api/tutor/**`, `src/components/tutor/**`

---

## Registration

- **Register as a tutor** — sign up with first/last name, email, password, grade level, section, optional contact info, and consent. A `TutorProfile` is created in the same transaction as the `User`. Only accepted while `registrationOpen` platform setting is `true`.
  (`POST /api/register`)
- Receives a sequential anonymous ID in the form `TUT-XXXX`, generated atomically via `generateAnonymousId("TUTOR")`.

## Class Management (`/tutor/classes`)

- **View own classes** — list all classes the tutor has created, optionally filtered by status; includes each class's topics and the roster of enrolled learners (learners are shown only by anonymized info: ID, grade level, section — never real name/email).
  (`GET /api/tutor/classes`)
- **Create a class** — choose a subject, one or more topics (validated against the subject's predefined topic list), description, scheduled date/time, duration, max student capacity, and optional meeting link.
  - Blocked from scheduling in the past.
  - Blocked if it overlaps another of the tutor's own `SCHEDULED` classes (conflict detection).
  - If `requireCertificationForClassCreation` is enabled platform-wide, every selected topic must have a `CERTIFIED` `TopicCertification` for that tutor, or the request is rejected.
  (`POST /api/tutor/classes`)
- **Edit a class** — update subject/topics/description/schedule/duration/capacity/meeting link, or manually set status to `SCHEDULED`, `COMPLETED`, or `CANCELLED`.
  - Only the owning tutor may edit; a class suspended or banned by an admin cannot be modified.
  - Capacity cannot be reduced below the current enrollment count.
  - Rescheduling re-runs past-date and overlap-conflict checks.
  (`PATCH /api/tutor/classes/[classId]`)
- **Delete a class** — only allowed if no learners are enrolled; otherwise the tutor must cancel instead of delete.
  (`DELETE /api/tutor/classes/[classId]`)
- **View enrolled learners' roster** per class (anonymized — `anonymousId`, grade level, section only).

## Topic Certifications (`/tutor/classes`, certifications panel)

- **Request a topic assessment/certification** — submit a request for a specific `subject` + `topic` pair (must belong to the subject's predefined topic list). Creates/upserts a `PENDING` `TopicCertification`; re-requesting an already-requested topic is idempotent (no duplicate).
  (`POST /api/tutor/topic-certifications`)
- **View own certification requests and statuses** — list of all certifications requested by the tutor (`PENDING` or `CERTIFIED`).
  (`GET /api/tutor/topic-certifications`)
- Certifications are reviewed and approved/rejected by an **ADMIN** (see [[admin-role]]); the tutor cannot self-approve.
- Being `CERTIFIED` in a topic is what unlocks teaching it when `requireCertificationForClassCreation` is enabled, and is surfaced to learners in the class browser as a "verified topic" signal.

## Profile (`/tutor/profile`)

- **View own account info** — real name, email, anonymous ID (`TUT-XXXX`), and role. Read-only; no self-service editing UI currently exists.

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

**200** → array of `TutorClass`, each with `topics: string[]` and `enrollments: [{ ...enrollment, learner: { id, anonymousId, firstName, lastName, gradeLevel, section } }]`.
**500** → `{ error }`.

### `POST /api/tutor/classes`
Create a new class.

**Body**
```json
{
  "subject": "SubjectArea enum",
  "topics": ["string", "... (1–10 items, each non-empty)"],
  "description": "string (≤500 chars, optional)",
  "scheduledAt": "ISO datetime string",
  "duration": "int minutes (15–240)",
  "maxStudents": "int (1–10)",
  "meetingLink": "string (valid URL, optional)"
}
```
- Every topic must belong to `SUBJECT_TOPICS[subject]`.
- If `requireCertificationForClassCreation` is on, every topic must have a `CERTIFIED` `TopicCertification` for this tutor.
- `scheduledAt` must not be in the past.
- Rejected if it time-overlaps another of the tutor's own `SCHEDULED` classes.

**201** → created `TutorClass` (`topics` as `string[]`).
**400** → invalid topics/uncertified topics/past date/validation error.
**401** → not a tutor. **404** → no tutor profile.
**409** → `{ error: "Time conflict detected: ..." }`.
**500** → `{ error }`.

### `PATCH /api/tutor/classes/[classId]`
Edit an owned class (partial update — all `createClassSchema` fields optional, plus `status`).

**Body** (any subset of the create-class fields) plus optionally:
```json
{ "status": "SCHEDULED" | "COMPLETED" | "CANCELLED" }
```
- Only the owning tutor may edit (`403` otherwise); a `SUSPENDED`/`BANNED` class cannot be edited (`403`).
- `maxStudents` cannot drop below current enrollment count (`400`).
- Changing `scheduledAt`/`duration` while (becoming) `SCHEDULED` re-checks past-date (`400`) and overlap conflict (`409`) against the tutor's other `SCHEDULED` classes.
- Supplying `topics` replaces the full topic set (`deleteMany` + recreate).

**200** → updated `TutorClass`.
**400** → invalid status/capacity/past date/validation error.
**403** → not the owner, or class is suspended/banned.
**404** → class not found.
**409** → time conflict.
**500** → `{ error }`.

### `DELETE /api/tutor/classes/[classId]`
Delete an owned class. Only allowed with zero enrollments.

**200** → `{ message: "Class deleted successfully." }`.
**400** → `{ error: "Cannot delete a class that has enrolled learners. Please cancel the class instead." }`.
**403** → not the owner. **404** → class not found.
**500** → `{ error }`.

### `GET /api/tutor/topic-certifications`
List the authenticated tutor's own certification requests (`PENDING` or `CERTIFIED`), newest-requested-first.

**200** → array of `TopicCertification`.
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

## What Tutors Cannot Do

- Cannot browse or enroll in classes (that's the learner's role).
- Cannot approve their own certification requests.
- Cannot modify a class once an admin has suspended or banned it.
- Cannot reduce a class's capacity below its current enrollment count.
