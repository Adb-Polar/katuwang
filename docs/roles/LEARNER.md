# STUDENT_LEARNER Role

The `STUDENT_LEARNER` role lets a student browse and join peer tutoring sessions offered by tutors. Learners access the `/learner` portal.

Source: `src/app/learner/**`, `src/app/api/classes/**`, `src/components/learner/**`

---

## Registration

- **Register as a learner** — sign up with first/last name, email, password, grade level, section, optional contact info, and consent. Only accepted while the `registrationOpen` platform setting is `true`.
  (`POST /api/register`)
- Receives a sequential anonymous ID in the form `STU-XXXX`, generated atomically via `generateAnonymousId("LEARNER")`.

## Class Browsing (`/learner/classes`)

- **Browse upcoming classes** — see every `SCHEDULED` class whose start time is in the future, plus any class the learner is already enrolled in (even if it has since ended or changed status). Expired suspensions are auto-reinstated (`reinstateExpiredClasses`) before results are returned.
  (`GET /api/classes`)
- Each listing shows: subject, topics, description, schedule, duration, capacity/enrollment count, meeting link, and the tutor's anonymized identity (`anonymousId` only — never real name/email).
- **Verified topics** — topics the teaching tutor holds a `CERTIFIED` `TopicCertification` for are flagged separately, letting learners identify vetted tutors for a given topic.

## Enrollment (`/learner/classes`)

- **Enroll in a class** — join a `SCHEDULED`, not-yet-started class that still has open seats.
  - Blocked if the class isn't `SCHEDULED`, has already started, is full, or the learner is already enrolled.
  (`POST /api/classes/[classId]/enroll`)
- **Unenroll from a class** — leave a class the learner is currently enrolled in, as long as it's still `SCHEDULED` (can't unenroll from a completed/cancelled class).
  (`DELETE /api/classes/[classId]/enroll`)

## Profile (`/learner/profile`)

- **View own account info** — real name, email, anonymous ID (`STU-XXXX`), and role. Read-only; no self-service editing UI currently exists.

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
List browsable + enrolled classes. Requires `role === "STUDENT_LEARNER"` (else `401`). Runs `reinstateExpiredClasses()` first to lift any expired admin suspensions.

Returns every `SCHEDULED` class with a future `scheduledAt`, plus any class the learner is enrolled in regardless of its current status.

**200** → array of:
```json
{
  "...TutorClass fields (id, subject, description, scheduledAt, duration, maxStudents, meetingLink, status, ...)": "...",
  "topics": ["string"],
  "verifiedTopics": ["string (topics the tutor holds a CERTIFIED cert for, within this class's subject)"],
  "tutor": { "id": "string", "anonymousId": "string" },
  "_count": { "enrollments": 0 },
  "enrollments": [{ "id": "string" }]
}
```
`enrollments` here is scoped to the requesting learner only (empty array if not enrolled) — used by the UI to detect enrollment state.
**500** → `{ error }`.

### `POST /api/classes/[classId]/enroll`
Enroll in a class. Runs `reinstateExpiredClasses()` first.

**200/201** → `201` with the created `ClassEnrollment { id, classId, learnerId, enrolledAt }`.
**400** → class isn't `SCHEDULED`, or has already started.
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

## What Learners Cannot Do

- Cannot create, edit, or moderate classes (that's the tutor's and admin's role, respectively).
- Cannot request or view tutor topic certifications.
- Cannot enroll in a class that is full, already started, cancelled, suspended, or banned.
- Cannot see other learners enrolled in the same class.
