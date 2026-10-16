# STUDENT_LEARNER Role

The `STUDENT_LEARNER` role lets a student browse and join peer tutoring sessions offered by tutors. Learners access the `/learner` portal.

Source: `src/app/learner/**`, `src/app/api/learner/**`, `src/app/api/classes/**`, `src/app/api/notifications/**`, `src/app/api/search/**`, `src/app/api/chatbot/**`, `src/components/learner/**`

---

## Registration

- **Register as a learner** — sign up with first/last name, email, password, grade level, section, optional contact info, and consent (linked to `/privacy-policy`). Only accepted while the `registrationOpen` platform setting is `true`. If the `requireEmailVerification` platform setting is on, login is blocked until you click the emailed verify link (`/verify-email`) — checked before the separate `requireRegistrationApproval` gate.
  (`POST /api/register`)
- Receives a sequential anonymous ID in the form `STU-XXXX`, generated atomically via `generateAnonymousId("LEARNER")`.

## Class Browsing (`/learner/classes`) and My Classes (`/learner/my-classes`)

A class (`TutorClass`) is a course that can span multiple **sessions** — individual meetings at different days/times, each covering one topic. Enrollment is always whole-class: one enrollment covers every session.

The two lists are separate sidebar pages, both backed by `GET /api/classes` (paginated, 12/page, `?scope=browse|mine&page=`):

- **Browse Classes** (`/learner/classes`, `scope=browse`) — every `SCHEDULED` + **published** class with at least one upcoming `SCHEDULED` session that the learner is **not** already enrolled in. A tutor can unpublish a class to hide it here without cancelling it. Expired suspensions are auto-reinstated (`reinstateExpiredClasses`) before results are returned.
  - With no search/subject/grade filter applied, the default order is lightly personalized: classes score higher for matching the learner's grade, overlapping a subject/topic the learner has engaged with (past enrollments or open class requests), starting sooner (within a 14-day horizon), and still having open seats. Applying any filter, or switching to My Classes, falls back to newest-first.
- **My Classes** (`/learner/my-classes`, `scope=mine`) — every class the learner is enrolled in, split into **Upcoming / Completed / Cancelled** status tabs (`?status=upcoming|completed|cancelled`, default `upcoming`; "Cancelled" also covers `BANNED` classes). Each tab shows its own count.
- The response also returns `counts: { browse, mine, mineTabs: { upcoming, completed, cancelled } }` so each page can show its totals.
- Each listing shows: subject, topics, description, all of its sessions, capacity/enrollment count, meeting link, and the tutor's anonymized identity (`anonymousId` only, unless an admin has enabled `showTutorRealNames` — see Find Tutors below). The class card surfaces the next upcoming session's date/time plus a total session count.
- **Verified topics** — topics the teaching tutor holds a `CERTIFIED` `TopicCertification` for are flagged separately, letting learners identify vetted tutors for a given topic.
- **View class details** — clicking a class opens a dedicated fullscreen detail page (`/learner/classes/[classId]`, server-rendered directly from Prisma — 404s unless the class is currently browsable or the learner is enrolled in it), showing the full session list (read-only — date, topic, duration, status per session), description, and the tutor's identity. If the learner is enrolled but the tutor has since **unpublished** the class, the page shows a "not published yet" placeholder instead of the details — the enrollment is kept, nothing is hidden permanently.
- **View the tutor's profile** — clicking the tutor's anonymous ID badge opens a dedicated fullscreen page (`/learner/tutors/[tutorId]`, server-rendered from Prisma — 404s if the id isn't a tutor): their identity (real name shown only when `showTutorRealNames` is on), their verified (`CERTIFIED`) topics grouped by subject, a **"This week"** timetable of their scheduled sessions over the next 7 days, and their classes split into **Active** / **Completed** tabs (each card links to that class's detail page). A stranger only sees the tutor's `SCHEDULED` (published) classes; a `SUSPENDED`/`BANNED`/`COMPLETED` class only surfaces here if the viewing learner is themself enrolled in it.
- **Request a topic from this tutor** — a "Request a topic from this tutor" button on that same profile page opens the same criteria form used on `/learner/requests`, but submits with `directedTutorId` set so the request is **directed**: only that tutor sees it (see Class Requests below).

## Find Tutors (`/learner/tutors`)

- **Browse verified tutors** — a card grid of every `ACTIVE` Student Tutor holding at least one `CERTIFIED` topic. Each card shows the tutor's `anonymousId`, the subjects they're certified in, a badge per **verified class** (a published, `SCHEDULED` class covering at least one of their certified topics), their verified-topic count, how many published classes they run, and when their next scheduled session is. Real names appear only when an admin has enabled `showTutorRealNames`.
- **Filter** by anonymous ID (free text, e.g. `TUT-01`) and by subjects they're certified to teach — multiple subjects can be selected at once (AND: the tutor must be certified in every chosen one). Paginated; page + page size live in the URL.
- Clicking a card opens that tutor's profile page (below).
  (`GET /api/learner/tutors`)

## Enrollment (`/learner/classes/[classId]`)

- **Enroll in a class** — join a `SCHEDULED` class that has at least one upcoming `SCHEDULED` session and still has open seats. Enrolling joins the whole course, not an individual session.
  - Blocked if the class isn't `SCHEDULED`, is unpublished, has no upcoming session, is full, or the learner is already enrolled.
  (`POST /api/classes/[classId]/enroll`)
- **Unenroll from a class** — leave a class the learner is currently enrolled in, as long as it's still `SCHEDULED` (can't unenroll from a completed/cancelled class). Unenrolling is whole-class regardless of individual session states — you can't unenroll from just one session, since later sessions build on earlier ones.
  (`DELETE /api/classes/[classId]/enroll`)

## Session Pre/Post-Tests (`/learner/classes/[classId]/sessions/[sessionId]/test/[kind]`)

For a session with a published test, a short diagnostic quiz is taken
**twice**: once before the session (pre-test), once after your tutor marks
it `COMPLETED` (post-test). Both runs serve the identical question set, so
your own score change is measurable question-by-question. It's diagnostic
only — no pass/fail, no grade impact.

- **Take the pre-test** — from the class page's Session Tests card, once
  your tutor publishes it. Answer all questions and submit; you can leave
  and resume an in-progress attempt any time before submitting.
  (`POST /api/learner/classes/[classId]/sessions/[sessionId]/test/PRE/start`)
- **The post-test opens automatically** once your tutor marks that specific
  session complete — you're notified. If you were still mid-pre-test at that
  moment, it isn't cut short; you can still finish and submit it.
- **Review a submitted attempt** — see which answers were correct, the
  correct option and explanation for each question, and your score. A
  submitted post-test also shows your gain versus your pre-test score, when
  both were taken.
  (`GET /api/learner/session-test-attempts/[attemptId]`)
- **My Progress** (`/learner/progress`) — every session across your enrolled
  classes that had a test, plotted pre vs post, with a summary (sessions
  with a test, how many were paired pre+post, your average gain). Filterable
  by class. A compact version of the same chart appears on each class's own
  page. Shows only your own scores — no tutor identity, no class-average
  figure (a small class would make "class average" identify a classmate).
  (`GET /api/learner/progress?classId=`)
- Missing the pre-test window (session already completed) or the post-test
  window (session not yet completed) simply means that run isn't available —
  it isn't an error you caused.

## Automatic Matching (`/learner/match`)

- **Find a class** — describe what you need (subject, one or more topics, an optional grade level, an optional 1-on-1 vs. group preference, and any number of preferred weekly time windows) and get a ranked list of open, browsable classes that fit. Enrolling still happens through the normal class detail page — matching only ranks, it never enrolls.
  (`POST /api/learner/match`)
- Ranking is class-first (never a bare tutor): a class scores on how many requested topics it covers, whether the tutor is `CERTIFIED` for those topics, how many of its upcoming sessions land inside your preferred windows, how close its target grade is to yours, and how soon the next session is. Classes in the wrong subject, already full, unpublished, with no upcoming session, or that don't match your 1-on-1/group preference are dropped, as are classes you're already enrolled in.
- Grade level is prefilled from your profile; change it if you're looking for help at a different level.
- Gated by the `matchingEnabled` platform setting — when an admin turns it off, the endpoint returns `403`.

## Class Requests (`/learner/requests`)

UI copy calls this feature "class request" (changed 2026-09-06); the underlying Prisma model, API routes, and page route are unchanged and still say `TopicRequest`/`topic-requests` in code — see the API Reference below and `docs/reference/decisions.md`.

- **Post a class request** — when nothing fits, record what you want to learn: subject, topics (validated against the subject's topic list), grade level, optional preferred time windows, and an optional note. A request is either:
  - **Public** (default) — every tutor certified in at least one of your requested topics can see it.
  - **Directed** — submit with `directedTutorId` (or use "Request a topic from this tutor" on a tutor's profile page) so only that one tutor sees it. That tutor gets a notification.
  (`GET`/`POST /api/learner/topic-requests`)
- Up to 10 `OPEN` requests at a time.
- **Edit a request** — while it's still `OPEN`, change its subject/topics/grade level/preferred slots/note from the same list (an `ACCEPTED` request can no longer be edited, only cancelled).
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

## Reporting a tutor or class (`/learner/reports`)

- You can **report a tutor** from their profile (`/learner/tutors/[tutorId]`) — the "Report this tutor" button appears **only if you have joined at least one of that tutor's currently published classes** (the profile page only loads published classes to compute this; the report API itself checks your enrollment history against the tutor with no published-status restriction).
- You can **report a class** from its detail page (`/learner/classes/[classId]`) — the "Report this class" button appears **only while you are enrolled**.
- The report form is a checklist of common violations (different sets for a tutor vs. a class) plus an **Other** option; ticking Other requires a written description of at least 10 characters. You must tick at least one reason.
- Only administrators see the report. Your identity is **not** shared with the tutor. You cannot have two open reports about the same target at once.
- **My Reports** (sidebar, under Tools) lists every report you filed with its status — `PENDING`, `RESOLVED` (an admin acted on it), or `DISMISSED` (closed with no action) — plus the admin's note once reviewed. You're also sent a `REPORT_REVIEWED` notification when an admin closes a report.
  (`GET`/`POST /api/learner/reports`)

## Notifications (`/learner/notifications`)

- A **Notifications** sidebar item (bell icon) shows an unread-count badge, and the topbar bell shows a red dot when you have unread notifications — clicking it opens a dropdown of the 8 most recent. Both are sourced from `Notification` rows addressed to you and refresh on navigation.
- The page (and the dropdown) list notifications newest first (icon by type, message, relative time, unread dot). Clicking a row marks **just that one** read and follows its link if it has one; a "Mark all read" button clears the rest.
- Notification types you'll see: `TOPIC_REQUEST_ACCEPTED` (a tutor built a class for your request), `TOPIC_REQUEST_REOPENED` (a linked class was cancelled, or an admin closed/re-opened your request), `TOPIC_REQUEST_FULFILLED` (a linked class completed), `REGISTRATION_APPROVED` (your account was approved), `CLASS_CANCELLED` / `CLASS_COMPLETED` (a class you were enrolled in — sent to browse-enrolled learners; request-linked learners get the `TOPIC_REQUEST_*` one instead), `SESSION_PRETEST_OPEN` (your tutor published a session's pre-test), `SESSION_POSTTEST_OPEN` (your tutor marked that session complete, opening its post-test), `REPORT_REVIEWED` (an admin resolved or dismissed a report you filed), `CLASS_RECOMMENDED_BY_ADMIN` (an admin recommended a specific class to you, linking straight to it — informational only, you still enroll yourself; not the same as the chatbot's own class recommendation above).
  (`GET /api/notifications`, `POST /api/notifications/read`)

## Chatbot assistant (floating widget)

- A launcher button sits at the bottom-right of every page. It opens a small chat panel — an **intent-based** assistant (rule/keyword matching, not a generative AI).
- It can: point you to the right page (browse, enrol, matching, requests, notifications, profile, password reset), answer common questions about how Katuwang works, and **recommend classes** — ask e.g. "recommend a science class" or "I need help with algebra" and it ranks open classes for you (or suggests posting a class request if none fit). It understands common Taglish phrasings.
- It does **not** run tutoring sessions or answer schoolwork. The transcript is kept in your browser only. An admin can switch the assistant off platform-wide. Messages are rate-limited (20/minute per account) — a `429` past that limit asks you to slow down.
  (`POST /api/chatbot`)

## Profile (`/learner/profile`)

- **View own account info** — real name, email, anonymous ID (`STU-XXXX`), and role. Always read-only.
- **Edit `contactInfo`, `section`, and `gradeLevel`** — the self-service editable fields on the `/learner/profile/edit` form.
  (`PATCH /api/learner/profile`) `contactInfo` is format-checked: a phone-like value must be a
  PH mobile number and is normalised to `09XXXXXXXXX`; anything else is kept as a free-form handle.
  The API also accepts an optional `recoveryEmail` (a backup address `/forgot-password` will also
  accept), but there's no field for it on the profile edit form yet — it can only be set by calling
  the endpoint directly.
- **Change password** — a separate card on `/learner/profile/edit`, requiring the current password.
  (`POST /api/learner/profile/password`, `401` on a wrong current password.) Added 2026-09-14.
- Name and email are **not** self-editable: email changes need a dedicated security flow (not yet
  built); name changes are avoided on an anonymity-sensitive platform where the session's cached
  `fullName` only refreshes on next login. Grade level became self-service on 2026-09-06 (see
  `docs/reference/decisions.md`).

## Privacy & Identity

- By default, learners never see a tutor's real name, email, or contact info — only the tutor's `anonymousId`. An admin can flip the platform-wide `showTutorRealNames` setting to surface the tutor's real name and section (never email/contact info) alongside the anonymous ID.
- A learner's own real identity is visible only to themself and to admins (for moderation); tutors only ever see the learner's `anonymousId`, grade level, and section on their class roster.

## API Reference

### `POST /api/register`
Register a new learner account. No auth required. `403 { error: "Registration is currently closed." }` when the `registrationOpen` platform setting is `false`. Rate-limited to 5 requests per hour per IP (`429` past that, with a `Retry-After` header).

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

**201** → `{ message, anonymousId, pendingApproval, requiresVerification }`.
**400** → validation error (first Zod issue message).
**403** → registration closed.
**409** → `{ error: "An account with this email already exists." }`.
**500** → `{ error }`.

### `GET /api/classes`
Paginated class list for the learner. Requires `role === "STUDENT_LEARNER"` (else `401`). Runs `reinstateExpiredClasses()` first to lift any expired admin suspensions.

**Query params** (all optional): `scope` (`browse` | `mine`, default `browse`), `page` (default `1`), `pageSize` (default `12`, max `50`), `status` (mine only — `upcoming` | `completed` | `cancelled`, default `upcoming`).
- `scope=browse` → `SCHEDULED` + **published** classes with an upcoming `SCHEDULED` session that the learner is **not** enrolled in. With no `q`/`subject`/`gradeLevel` filter, results are lightly personalized (grade/subject/topic interest, soonness, open seats) instead of newest-first.
- `scope=mine` → classes the learner is enrolled in, narrowed to the `status` tab: `upcoming` (`SCHEDULED`/`SUSPENDED`), `completed` (`COMPLETED`), or `cancelled` (`CANCELLED`/`BANNED`).
- `q` (browse only) → matches the class **code**, subject, any topic, or the tutor's anonymous ID (`contains`). `subject` / `gradeLevel` narrow further. Each class carries a `code` (`C-XXXX`).

**200**
```json
{
  "classes": [
    {
      "...TutorClass fields (id, subject, gradeLevel, description, maxStudents, meetingLink, status, published, ...)": "...",
      "topics": ["string"],
      "sessions": [{ "id": "string", "topic": "string", "scheduledAt": "ISO datetime", "duration": 0, "status": "SCHEDULED | COMPLETED | CANCELLED" }],
      "verifiedTopics": ["string (topics the tutor holds a CERTIFIED cert for, within this class's subject)"],
      "tutor": { "id": "string", "anonymousId": "string", "name?": "string (only when showTutorRealNames is on)", "section?": "string" },
      "_count": { "enrollments": 0 },
      "enrollments": [{ "id": "string" }]
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 0,
  "counts": { "browse": 0, "mine": 0, "mineTabs": { "upcoming": 0, "completed": 0, "cancelled": 0 } }
}
```
`total` is the count for the requested `scope`/tab; `counts` carries every tab's total so a page can label them all at once. `enrollments` per class is scoped to the requesting learner only.
**500** → `{ error }`.

### `POST /api/classes/[classId]/enroll`
Enroll in a class. Runs `reinstateExpiredClasses()` first.

**200/201** → `201` with the created `ClassEnrollment { id, classId, learnerId, enrolledAt }`.
**400** → `{ error: "This class is no longer accepting enrollments." }` (not `SCHEDULED` or unpublished), or `{ error: "This class has no upcoming sessions to enroll in." }`.
**401** → not a learner.
**404** → class not found.
**409** → `{ error: "This class is already full." }` or `{ error: "You are already enrolled in this class." }`.
**500** → `{ error }`.

Enrolling also flips a linked `ACCEPTED` class request to `ENROLLED` (see Class Requests) and notifies the tutor (`CLASS_ENROLLMENT_NEW`, tutor-facing — not in the learner notification list above).

### `DELETE /api/classes/[classId]/enroll`
Unenroll from a class.

**200** → `{ message: "Unenrolled successfully." }`.
**400** → `{ error: "Cannot unenroll from a class that is already completed or cancelled." }`.
**401** → not a learner.
**404** → class not found, or `{ error: "You are not enrolled in this class." }`.
**500** → `{ error }`.

Unenrolling flips a linked `ENROLLED` class request back to `ACCEPTED` and notifies the tutor (`CLASS_ENROLLMENT_DROPPED`, tutor-facing).

### `POST /api/learner/match`
Rank browsable classes against match criteria. Requires `role === "STUDENT_LEARNER"` (`401`). `403 { error: "Matching is currently unavailable." }` when `matchingEnabled` is off.

**Body**
```json
{
  "subject": "string (subject slug, e.g. \"MATH\")",
  "topics": ["string (1–10, each in SUBJECT_TOPICS[subject])"],
  "gradeLevel": "GradeLevel enum (optional)",
  "preferredSlots": [{ "day": "MONDAY", "startTime": "15:00", "endTime": "17:00" }],
  "classFormat": "\"SOLO\" | \"GROUP\" | \"ANY\" (optional — 1-on-1 vs. group filter)"
}
```
- `preferredSlots` optional (max 21); `day` is one of the 7 weekday names, times are `HH:MM` 24h with `startTime < endTime`.
- `classFormat`: `"SOLO"` restricts to `maxStudents === 1` classes, `"GROUP"` to `maxStudents > 1`; omitted/`"ANY"` applies no filter.

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
  "subject": "string (subject slug, e.g. \"MATH\")",
  "topics": ["string (1–10, each in SUBJECT_TOPICS[subject])"],
  "gradeLevel": "GradeLevel enum (required)",
  "preferredSlots": [{ "day": "MONDAY", "startTime": "15:00", "endTime": "17:00" }],
  "note": "string (≤500 chars, optional)",
  "directedTutorId": "string (optional — the tutor's User id; omit for a public request)"
}
```
- When `directedTutorId` is given, it must resolve to a real `STUDENT_TUTOR` with a `TutorProfile` (`400` otherwise); the request's `directedTutorProfileId` is set and that tutor gets a `TOPIC_REQUEST_DIRECTED` notification, in the same transaction as the create.
- The body schema is shared with `POST /api/learner/match` and also accepts `classFormat`, but `TopicRequest` has no such column — it's silently ignored here (Auto Match only).

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

### `GET /api/learner/reports`
The caller's own reports, newest first. Requires `role === "STUDENT_LEARNER"` (`401`).

**200** → `{ reports: [{ id, targetType: "TUTOR"|"CLASS", target: { anonymousId? } | { code?, subject? }, violations: string[], details, status, resolutionNote, reviewedAt, createdAt }] }`. The reviewing admin's identity is never included.
**500** → `{ error }`.

### `POST /api/learner/reports`
File a report against a tutor or a class.

**Body**: `{ targetType: "TUTOR"|"CLASS", targetId, violations: ReportViolationType[], details? }`. `targetId` is the tutor's **user id** for `TUTOR` and the **class id** for `CLASS`. `violations` must have at least one value from the target's checklist; `details` is required (≥10 chars) when `violations` contains `"OTHER"`.

**201** → the created report.
**400** → body invalid (no violation, or `OTHER` without a description).
**401** → not a learner.
**403** → no enrollment relationship with the target (must have joined one of the tutor's classes / be enrolled in the class).
**404** → tutor or class not found.
**409** → the caller already has a `PENDING` report about that target.
**500** → `{ error }`.

### `GET /api/learner/tutors`
Browsable tutors for the Find Tutors page. Requires `role === "STUDENT_LEARNER"` (`401`).

**Query params** (all optional): `q` (matches `anonymousId`, `contains`), `subjects` (comma-separated subject slugs — restricts to tutors `CERTIFIED` in **every** listed subject; `subject`, singular, is still accepted as a legacy one-value alias), `page` (default `1`), `pageSize` (default `12`, max `48`).

**200** → `{ tutors: [{ id, anonymousId, name?, section?, verifiedTopicCount, subjects: string[], verifiedClasses: [{code, subject}], publishedClassCount, nextSessionAt }], total, page, pageSize }`. `name`/`section` are present only when `showTutorRealNames` is enabled. `verifiedClasses` lists the tutor's published, `SCHEDULED` classes that cover at least one of their certified topics.
**401** → not a learner.
**500** → `{ error }`.

### `GET /api/search`
Quick search behind the top-bar box. Any authenticated role; results are scoped to the caller's role. Rate-limited to 40 requests/minute per account (`429` past that).

**Query params**: `q` (required; fewer than 2 characters returns `{ groups: [] }`), `scope` (optional — `all` (default) | `tutorCode` | `subject` | `topic` | `classCode`, narrows which field(s) a class/tutor match is checked against).

**200** → `{ groups: [{ kind: "class" | "tutor" | "topic", label, items: [{ id, title, subtitle?, href }] }] }`. Learners get browsable classes + verified tutors + topics; tutors get their own classes + class requests + topics; admins get all classes + accounts + topics. Max 6 items per group; a group with zero matches is omitted.
**401** → not authenticated.
**500** → `{ error }`.

### `GET /api/notifications`
The caller's own notifications, newest first, capped at 50. Optional `?take=N` clamps the page size to `1..50` (the topbar bell dropdown uses `?take=8`). Any authenticated role (not gated to learners).

**200** → `{ notifications: [{ id, type, message, link, readAt, createdAt }], unreadCount }`.
**401** → not authenticated.
**500** → `{ error }`.

### `POST /api/notifications/read`
Mark notifications read.

**Body**: `{ "ids"?: string[] }` — omitted/empty marks **all** of the caller's unread notifications read; otherwise only the given ids.

**200** → `{ unreadCount }`.
**401** → not authenticated.
**500** → `{ error }`.

### `POST /api/chatbot`
Ask the intent-based assistant. Any authenticated role. Rate-limited to 20 requests/minute per account (`429` past that).

**Body**: `{ "message": "string (1–500 chars)" }`.

**200** → `{ reply: { text, intentId, category, links?, cards?, suggestions? } }`. `cards` (class recommendations) only appear for learners. Unmatched messages return the fallback reply and are logged to `chatbot_misses`.
**400** → empty / over-length message.
**401** → not authenticated.
**403** → the `chatbotEnabled` platform setting is off.
**500** → `{ error }`.

### `PATCH /api/learner/profile`
Update the learner's own self-service profile fields. Requires `role === "STUDENT_LEARNER"` (`401`).

**Body** (partial)
```json
{
  "contactInfo": "string (≤200 chars, optional)",
  "section": "string (1–50 chars, optional)",
  "gradeLevel": "GradeLevel enum (optional)",
  "recoveryEmail": "string (valid email, optional — no UI field for this yet, see Profile above)"
}
```
- Updates by the session's own user id — no ownership-check surface, so no `403`/`404`/`409`.
- An empty-string `contactInfo` or `recoveryEmail` clears the field (stored as `null`).

**200** → `{ contactInfo, section, gradeLevel, recoveryEmail }` (only these four fields — never echoes email/name).
**400** → validation error (empty section, `contactInfo` too long, invalid `gradeLevel`/`recoveryEmail`).
**401** → not a learner.
**500** → `{ error }`.

### Session pre/post-tests (`sessionTestsEnabled`-gated)

All routes are `role === "STUDENT_LEARNER"`; ownership of the *attempt* (not
just the class) is checked for the two attempt routes.

- `GET /api/learner/classes/[classId]/session-tests` → `{ sessions: [{ sessionId, topic, scheduledAt, sessionStatus, test: {id,title,status}|null, pre, post }] }`, one row per session in the class. A `DRAFT` test reports as `test: null` — indistinguishable from no test at all. **403** if not enrolled in the class.
- `POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start` (`kind` = `PRE`|`POST`) → creates a new attempt (**201**) or resumes an existing `IN_PROGRESS` one (**200**) — resuming is never blocked by session status. **404** bad kind, class/session not found, no test, or `DRAFT` test. **403** not enrolled in the class, the class is under moderation, or `sessionTestsEnabled` is off. **409** `CLOSED` test, already-submitted, or the session-status gate not open yet (`code: "PRE_WINDOW_CLOSED"` once the session is `COMPLETED`, `code: "POST_NOT_OPEN"` while still `SCHEDULED`, `code: "SESSION_CANCELLED"`).
- `GET /api/learner/session-test-attempts/[attemptId]` → your own attempt; answers/score revealed only once `SUBMITTED`. **404** (never `403`) if it isn't yours — doesn't confirm the id exists.
- `POST /api/learner/session-test-attempts/[attemptId]/submit` → grade + submit (`{ answers: [{questionId, optionId}] }`). **409** if already submitted.
- `GET /api/learner/progress?classId=` → `{ series: [{classCode, subject, topic, scheduledAt, preScore, postScore, delta}], summary: {sessionsWithTest, pairedCount, avgDelta} }` — your own results only, no tutor identity or class-average anywhere in the payload.

## What Learners Cannot Do

- Cannot create, edit, or moderate classes (that's the tutor's and admin's role, respectively).
- Cannot request or view tutor topic certifications.
- Cannot enroll in a class that is full, unpublished, has no upcoming sessions, or isn't `SCHEDULED` (completed, cancelled, suspended, or banned).
- Cannot unenroll from a single session — enrollment and unenrollment are always whole-class.
- Cannot see other learners enrolled in the same class.

## Help & FAQs (`/learner/help`)

- In-portal Help Center: **Jump to** quick links, **step-by-step guides** (find/join a class, use Auto Match, post a class request, leave a class), and a **searchable FAQ** accordion covering general, privacy, classes, requests, matching, and account topics.
- Content is static (`src/lib/help/helpContent.ts`, `LEARNER` entry) rendered by the shared `HelpCenter` component; no API. Also reachable from the topbar `?` button.
