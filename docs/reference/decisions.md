# Decisions & Divergences from the Thesis Reference Doc

The checked-in thesis document (`docs/reference/Katuwang_...md`) is the
academic paper backing this capstone project. It is **not** kept in sync
with implementation decisions made afterward — treat it as a historical
snapshot of the original proposal, not a live spec. This file is the
authoritative record of where the running app has deliberately diverged from
it, and why. Check here before flagging something in that doc as a "missing
feature."

Format: newest first.

---

## Lucide icon set supersedes the no-SVG invariant (2026-09-10)

**Decision:** The app uses `lucide-react` for navigation, row, action, and status
icons (imported in ~70 files). The Fragment Mono letter-tile survives only as the
nav-group glyph (`.kt-ic`).

**Design doc says otherwise:** `design/ROUND-2-CONTEXT.md` invariant #6 ("No
pictographic SVG icons — letter-tiles / text glyphs only") and its "Prohibited
normalisation" section both ban an SVG icon set. That invariant is now marked
SUPERSEDED in place.

**Why:** ROUND-2's own "Open issues carried into Round 2 verification" flagged the
letter-tiles as a placeholder — "decide keep-letters vs. icon-font vs. CSS icons
(no SVG) at implementation." Lucide was chosen at implementation for legibility
and coverage; the decision was just never written down. Recorded now per the
`CLAUDE.md` rule.

**Implication for agents:** Lucide icons are fine to use and add. Do not "restore"
letter-tiles for row/action icons. Keep icons decorative (`aria-hidden`) with a
real text label alongside.

---

## Live palette supersedes `docs/reference/theme.md` (2026-09-10)

**Decision:** The authoritative theme is the `@plugin "daisyui/theme"` block in
`src/app/globals.css`. `docs/reference/theme.md` has been retired to a pointer at
that block.

**Doc said otherwise:** the old `theme.md` documented an earlier palette
(`--color-primary: oklch(69% 0.17 162.48)` bright emerald, `--color-secondary:
oklch(0% 0 0)` pure black, `--color-accent: oklch(62% 0.265 303.9)` vivid violet).
The shipped palette is muted deep teal / ube violet / marigold gold
(`oklch(40% 0.09 174)` / `oklch(48% 0.16 300)` / `oklch(76% 0.14 80)`). Anyone
building from the old file got the wrong colours.

**Why:** the palette was retuned during implementation (warm-neutral surfaces,
role colours pulled apart in hue so gold and orange-red don't collide) and
`theme.md` was never regenerated. One source of truth is `globals.css`.

**Implication for agents:** read colour tokens from `src/app/globals.css`, never
from `theme.md`. The `--kt-*` derived tokens (tints, badge text, muted/faint)
live in the same file just below the theme block.

---

## Learner reports for tutors & classes (2026-09-10)

**Decision:** Learners can now report a tutor or a class for admin review. Scope
choices, locked with the project owner:

- **Relationship-gated.** A learner may report a tutor only if they are/were
  enrolled in one of that tutor's classes, and may report a class only if
  enrolled in it. Prevents drive-by spam reports; enforced in
  `POST /api/learner/reports` (403 otherwise) and mirrored in the UI (the
  "Report" button is hidden without the relationship).
- **Both targets get a checklist + "Other".** `ReportViolationType` enum with
  per-target option sets in `src/lib/reportViolations.ts`; "Other" requires a
  10+ char message.
- **Admin review is Resolve / Dismiss + note only.** The `/admin/abuse-reports`
  queue does **not** suspend or ban anyone. Any enforcement is still done from
  `/admin/users` or `/admin/classes`. Keeps the report a routing/tracking
  record, not a second enforcement surface.
- **Data model:** one `Report` table with `targetType` + a nullable
  `reportedTutorProfileId` **or** `classId` (exactly one, enforced in the API),
  and a `ReportViolation` child table for the ticked items (3NF, mirrors
  `ClassTopic`).

**Thesis text says otherwise:** the proposal doc does not describe a
learner-initiated reporting flow at all — this is an addition, not a
contradiction. Logged here because it's a moderation-scope decision future
agents should not re-litigate (e.g. "add inline ban to the report queue").

**Implication for agents:** enforcement lives on the Users/Classes pages, not
the report queue. Don't add account/class status mutations to
`PATCH /api/admin/abuse-reports/[reportId]`.

## "Topic request" is called "Class request" in the UI (2026-09-06)

**Decision:** All learner/tutor/admin-facing copy now says **"class request"**
instead of "topic request" (headings, nav labels, page titles, help/FAQ/chatbot
text, notification subtitles). A learner posts a *class request*; a tutor
accepts it to create a class.

**Unchanged:** the data model and code (`TopicRequest`, `TopicRequestTopic`,
`TopicRequestSlot`, `directedTutorProfileId`), the API routes
(`/api/tutor/topic-requests`, `/api/admin/topic-requests`), the page routes
(`/tutor/requests`, `/admin/topic-requests`, `/learner/requests`), and the
`docs/` that describe the implementation. Only user-visible strings changed.

**Why:** "topic request" tested as confusing next to the Assessment module's
per-topic language — learners read it as "requesting a topic be added". What
they actually get is a class, so the label now matches the outcome.
`fixes.txt` Redesign→General ("Rename Topic request to class request").

**Implication for agents:** when adding UI copy for this feature, say "class
request". Keep using `TopicRequest*` in code. Don't rename routes/models.

---

## Grade level is self-service on the profile page (2026-09-06)

**Decision:** A learner or tutor can change their own **grade level** (and
section) from `/{role}/profile`. `PATCH /api/{learner,tutor}/profile` accepts
`gradeLevel` (`z.nativeEnum(GradeLevel)`), and `ProfileEditForm` exposes it as
a `<select>`.

**Earlier note said otherwise:** `CLAUDE.md` and the profile copy said "Name,
email, and grade level changes require an administrator." Name and email still
do; grade level no longer does.

**Why:** Sept 5 review item 7 — students advance a grade every year and there
was no self-service path, forcing an admin ticket for a routine change. Real
name / email stay admin-only because they are the double-blind identity anchor.

**Implication for agents:** Treat `gradeLevel` + `section` as user-editable
profile fields. Only `firstName` / `lastName` / `email` require an admin route.

---

## Session pre/post-tests: scoped per session, not per class

**Decision:** The pre/post-test assessment (thesis module 4) is scoped to one
`SessionTest` per `ClassSession`, not per `TutorClass`. A class with 5
sessions can carry 5 independent tests, each gated to that specific
session's lifecycle (pre-test opens once published; post-test opens once
that one session is marked COMPLETED).

**Thesis text says otherwise (implicitly):** the thesis and the first
implementation attempt (an unmerged branch, `class-pre-post-tests`, commit
`1b6662c`) both modeled one PRE test + one POST test per class, covering the
whole class regardless of how many sessions it ran. That branch is now
superseded and safe to delete — its schema (`ClassTest`/`ClassTestQuestion`/
`ClassTestAttempt(+Item)`) and its migration
(`prisma/migrations/20260902081727_class_pre_post_tests/`) were never applied
to `main` and should not be resurrected.

**Why:** a single class-wide pre/post pair can't attribute a score change to
any particular session's material — with several sessions between the two
runs, "what caused the gain" is unrecoverable. Per-session scoping makes the
diagnostic meaningful: the pre-test measures readiness for *that* session's
topic, the post-test measures retention right after *that* session.

**Implication for agents:** don't look for `ClassTest*` models or
class-level test routes — they don't exist on `main`. The real models are
`SessionTest` / `SessionTestQuestion` / `SessionTestAttempt(+Item)`
(`prisma/schema.prisma`), one `SessionTest` per `sessionId` (unique). See
`docs/plans/pre-test-post-test-plan.md` for the full re-graining rationale.

## Session pre/post-tests: one question set served twice, not two separate tests

**Decision:** A `SessionTest` holds a single ordered `SessionTestQuestion[]`.
Learners take that *same* question set twice — once as a `PRE` attempt,
once as a `POST` attempt — via `SessionTestAttempt.kind`. There are no
separate PRE/POST question sets and no `kind` field on the test itself.

**Why:** `kind` living on the attempt (not the test) means `position` refers
to the identical question in both runs, which is what makes a per-question
pre→post delta ("did learners get Q3 right more often after the session?")
meaningful — comparing two independently-authored question sets wouldn't be.

**Implication for agents:**
- `pickQuestionIds()` (`src/lib/assessmentPicker.ts`, used by the tutor
  certification quiz) is **not** wired into session tests — a tutor builds a
  session test's question set manually (bank + self-authored questions), it
  is never auto-picked. Don't assume the two systems share a selection path.
- Every `AssessmentQuestion` query outside the certification-quiz/admin-bank
  path must filter `origin: "BANK"` (or intentionally not, with a comment) —
  see §5 of the plan. A tutor's self-authored (`origin: "TUTOR"`) questions
  must never leak into the certification quiz pool or another tutor's bank
  view.
- The full build (schema, backend, tutor/learner/admin UI, seed data) landed
  directly on `main` in one continuous effort (`Changes.md` Part 29, phases
  0–7) — there is no separate unmerged branch for this feature any more.

---

## Topic-requests-v2 rollout caused local dev-DB drift cleanup (2026-09-03)

**What happened:** while implementing `docs/plans/topic-requests-v2.md`, the
build agent found the shared local dev database (`katuwang_db`) had drift
from the `class-pre-post-tests` branch above — its `ClassTest*` tables and
two `assessment_questions` columns had been applied directly to the DB
outside a tracked migration on `main`. Reconciling schema drift via
`prisma migrate diff` against `main`'s `schema.prisma` **dropped those 4
stray tables and 2 stray columns** from the live local DB as a side effect.

**Why this is not data loss:** that branch's code and its own migration file
are untouched in git — checking it out and running `prisma migrate deploy`
+ reseeding fully restores the schema. Only ephemeral local dev/test data in
those tables was lost, not anything committed.

**Why this note exists:** the project owner said "acknowledge and move on"
when this was reported (2026-09-03), i.e. no action needed — but a DB
schema change of that shape (dropping tables outside the plan being
executed) should be confirmed with a human *before* it happens, not reported
after. If you find drift like this again, stop and ask rather than
resolving it unilaterally, even mid-task.

---

## 3 roles only — "Teacher Moderator" dropped

**Decision:** The platform ships with exactly 3 user roles —
`STUDENT_LEARNER`, `STUDENT_TUTOR`, `ADMIN`. There is no 4th "Teacher
Moderator" role or portal.

**Thesis text says otherwise:** The reference doc defines a "Teacher
Moderator" role (a TRIS faculty member who monitors sessions/assessment
analytics), lists it as one of four primary roles in Requirements Planning
(§3.2.1) and the ISO/IEC 25010 evaluation plan (§3.3), and its own internal
backlog table has a line item "Moderator Portal Baseline — Pending."

**Why:** Confirmed directly by the project owner (2026-09-03) — Teacher
Moderator was intentionally cut from scope. Moderation duties fold into
`ADMIN` instead of a separate role.

**Implication for agents:** Do not add a `TEACHER_MODERATOR` role, a
moderator portal, or route guards for it. Do not report "Teacher Moderator
not implemented" as a gap when comparing the app against the thesis doc —
it's dropped scope, not missed work. If asked to reconcile the two, this
file wins over the thesis doc.

---

## Known unbuilt modules (not divergences — genuinely pending)

Unlike the roles decision above, these are modules the thesis specs that
simply haven't been built yet. Listed here so agents don't waste time
re-deriving this from scratch; full detail in `docs/feature-checklist.md`.

- **Learner pre-test / post-test assessment** — the built assessment system
  (`AssessmentAttempt`, `AssessmentAttemptItem`, `TopicCertification`) is
  scoped entirely to `TutorProfile` (tutor qualifying exams). There is no
  learner-facing pre/post-test tied to a `ClassSession`, and no
  before/after progress-delta reporting. This is a distinct feature from
  tutor certification — don't conflate the two when asked about "the
  assessment module."

When either of these gets built, update this file (move the entry into a
dated "resolved" note or delete it) and `docs/feature-checklist.md` together.

---

## Notification system — scoped out of the 2026-09-04 expansion

The notification expansion (Changes.md Part 18) deliberately did **not** build:

- **Session reminders** ("your class starts in 1h") — needs a scheduler /
  cron / queue. The app has no such infrastructure (no polling, no SSE, no
  background jobs) and no request-driven trigger point.
- **Assessment-unlocked** ("a topic you requested now has enough questions")
  — fires as a side effect of an admin adding bank questions over time, not
  from a single request. The narrower `QUESTION_REQUEST_RESOLVED` (admin
  explicitly resolves the tutor's request) covers the realistic case.
- **Declined-registration `REGISTRATION_REJECTED` notification** — still not
  written: a declined applicant now has status `DECLINED` (Changes.md Part 22,
  not `BANNED`) and still can't sign in to see an in-app row. The decline
  reason instead reaches them on the `/account-declined` screen, which is what
  the need actually was — so no notification is planned.

These are infrastructure gaps, not thesis divergences — no scope was cut
against the spec.

---

## Chatbot Assistant — built deterministic (no LLM), 2026-09-04

**Decision:** Module 5 shipped as a rule-based intent matcher — tokenise the
message, score it against a fixed catalogue of ~25 role-aware intents + a
15-entry FAQ knowledge base by keyword/synonym/regex overlap, and return a
predefined response (optionally with a deep link or, for the learner
recommendation intent, live class matches from `rankMatches`). See
`docs/plans/chatbot-assistant.md` and Changes.md Part 19.

**Thesis alignment:** this matches the thesis exactly — it describes
"intent-based response logic" and the delimitations say "no free-form
generative chat". There is no LLM, no external NLP service, and no new
runtime dependency.

**Implications for agents:**
- Don't add an LLM/generative layer to the chatbot — it's out of scope by
  the thesis delimitation, not a limitation to "fix".
- The FAQ set in `src/lib/chatbot/faq.ts` is a **starter** — the thesis wants
  it refined from TRIS stakeholder interviews. Grow it from the
  `chatbot_misses` table (unmatched queries logged there).
- The only new table is `ChatbotMiss`. There is **no admin UI** to review
  misses in v1 — read the table directly.
- The widget is gated by the `chatbotEnabled` platform setting (default ON).

---

## Subjects & topics: compile-time enum → admin-editable tables (2026-09-04)

**Decision:** The subject taxonomy moved from the `SubjectArea` Prisma enum +
the static `SUBJECT_TOPICS` map to admin-editable `Subject` / `Topic` tables
(`/admin/subjects`). The `subject` column on the 6 models that had it
(`TutorClass`, `TopicRequest`, `TopicCertification`, `AssessmentQuestion`,
`AssessmentAttempt`, `QuestionRequest`) is now a plain `String` storing
`Subject.slug` — the slug is identical to the old enum value (`"MATH"`, …), so
the DB migration was a lossless `ENUM → VARCHAR` cast with no data-value
change and no backfill. Topics stay denormalised as strings on child rows;
`Topic` is the editable catalogue + validation source, and renaming a topic
fans the new name out to all 7 denormalised `topic` columns in one
transaction.

**Path chosen:** "string column + catalogue tables" (plan Path B), not a full
foreign-key rewrite (Path A). B delivers the same admin capability with a far
smaller blast radius and no FK migration; the app never had DB-level
referential integrity on `subject` anyway. See
`docs/plans/subject-topic-management.md`.

**Implications for agents:**
- There is no `SubjectArea` enum any more. `subject` is a `string` slug
  everywhere. Validate it with `subjectExists()` / `topicExists()` from
  `src/lib/subjects.ts` (cached; falls back to the static `SUBJECT_TOPICS`
  when the DB is unreachable, e.g. in unit tests).
- `src/lib/subjectTopics.ts` still exists — `normalizeTopic()` is the canonical
  topic-string normaliser, and `SUBJECT_TOPICS` is the seed/fallback list. It
  is **not** the source of truth at runtime; the `subjects`/`topics` tables are.
- Client dropdowns use the `useSubjectCatalog()` hook. A few non-critical spots
  still read the static map (`chatbot/recommend`, `api/dev`, the coverage
  report, `QuestionBankManager`'s drill-down) — fine to leave, convert
  opportunistically.
- Deleting a subject/topic that's in use is blocked (409); deactivate
  (`active:false`) instead. `Subject.slug` is immutable once created.

## How to add a new entry here

When a decision is made that contradicts or supersedes something in the
thesis reference doc, add a new `##` section above (newest first) with:
**Decision**, **Thesis text says otherwise** (quote or paraphrase + location
if relevant), **Why** (who decided, when, and the reason given), and
**Implication for agents** (the concrete "don't do X" or "do Y instead").
