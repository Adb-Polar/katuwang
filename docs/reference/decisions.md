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

## Learner pre-/post-test assessment exists — on an unmerged branch

**Status:** Not a divergence — this is a "don't re-derive from scratch" note.
`docs/feature-checklist.md` previously said the learner pre-/post-test
assessment (thesis module 4) was entirely unbuilt. That was true of `main`
but not of the repo: it's fully built and committed on branch
`class-pre-post-tests` (commit `1b6662c`, "Add class pre/post tests
(tutor-built, learner-taken)") — `ClassTest`/`ClassTestQuestion`/
`ClassTestAttempt(+Item)` models, a tutor test-builder UI, learner
take/resume/review flow, admin read-only results, and pre→post score-gain
reporting. It has its own committed migration
(`prisma/migrations/20260902081727_class_pre_post_tests/`).

**Implication for agents:** before telling someone this feature needs to be
built, check `git log --all --oneline | grep -i "pre.post"` / `git branch -a`
first — it may already exist unmerged. Don't duplicate the work.

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
- **Declined-registration delivery** — `REGISTRATION_REJECTED` is a reserved
  type but no row is written: a declined applicant is set `BANNED` in the
  same transaction and can never authenticate to see it. Tracked in
  `docs/TODO.txt`.

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
