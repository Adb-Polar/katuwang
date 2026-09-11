# Project Overview

Condensed domain context for agents. The full source is the capstone thesis at
`docs/reference/thesis.md` (~450KB — do not open it wholesale; this file
is the digest, and `docs/reference/decisions.md` covers where the app has
deliberately diverged from it).

## What Katuwang is

Katuwang ("helper"/"partner" in Tagalog) is a free, non-profit, web-based
**peer tutoring management platform** built for **Taysan Resettlement
Integrated School (TRIS)** in Legazpi City, Albay — a Philippine public
secondary school (Grades 7–12) serving a resettlement community, operating
under classroom overcrowding and split shifts.

The problem it addresses: students reach senior high still lacking basic
reading/math skills, teachers are overloaded and often teaching
out-of-field, and the school has no formal system to organize peer academic
support. Katuwang connects **student tutors** (peers who volunteer to teach)
with **student learners** (peers who need help) so tutoring can be organized,
tracked, and moderated instead of ad hoc. Everything is voluntary and free —
no payments, no monetization, anywhere in the system.

## Who uses it (3 roles — see `docs/reference/decisions.md`)

- **`STUDENT_LEARNER`** — browses/enrolls in tutoring classes, gets matched to
  tutors, can post a topic request when no class fits. Portal: `/learner`.
- **`STUDENT_TUTOR`** — creates and runs classes/sessions, gets certified per
  topic via a qualifying assessment, fulfills learner topic requests. Portal:
  `/tutor`.
- **`ADMIN`** — manages users, moderates classes/accounts, maintains the
  assessment question bank, reviews certifications, configures platform
  settings, views analytics/audit log. Portal: `/admin`.

Full per-role feature + API reference: `docs/roles/LEARNER.md`,
`docs/roles/TUTOR.md`, `docs/roles/ADMIN.md`.

## Privacy mandate — double-blind anonymity (RA 10173)

This is the platform's core non-negotiable constraint, driven by the
Philippine Data Privacy Act (RA 10173):

- Learners and tutors must **never** see each other's real name, email, or
  contact info across the peer boundary.
- Every student gets a sequential anonymous ID at registration —
  `STU-0001`-style for learners, `TUT-0001`-style for tutors — generated
  atomically via `generateAnonymousId()` (`src/lib/idGenerator.ts`).
- Peer-facing API responses and UI must expose only `id`/`anonymousId` (plus
  non-identifying data like grade level/section), never real name/email.
- Admins can see real identities (needed for moderation); a
  `showTutorRealNames` platform setting exists as an explicit, admin-gated
  override — not a default.

When touching any peer-facing query, code, or component, check that this
boundary holds. See `CLAUDE.md` §1 for the enforcement rule.

## The six core modules

The thesis scopes the system into six modules. Status of each (as actually
built) is tracked in `docs/reference/feature-checklist.md` — summary:

1. **User Management** — registration, auth, anonymous IDs, bcrypt hashing,
   RBAC, profile management, account moderation. ✅ built.
2. **Session Management** — tutors create classes (course containers) holding
   multiple sessions (individual meetings); learner enrollment; roster views.
   ✅ built.
3. **Tutor Matching** — weighted scoring algorithm (subject, topic overlap,
   grade-level compatibility, schedule fit) ranks classes for a learner;
   falls back to a learner-submitted topic request when nothing scores well.
   ✅ built — see `src/lib/matching.ts`.
4. **Assessment** — two distinct pieces, both ✅ built:
   (a) tutors must pass a per-topic qualifying quiz before being `CERTIFIED`
   to teach that topic (question bank is admin-authored); (b) a **separate**
   learner pre-test/post-test — one `SessionTest` per `ClassSession`, the same
   question set served twice (`kind: PRE|POST` on the attempt), diagnostic
   only, with pre→post score-gain reporting for tutor/learner/admin. Don't
   conflate the two. Kill switch: `sessionTestsEnabled`. See
   `docs/reference/feature-checklist.md` §4 and `docs/reference/decisions.md`.
5. **Chatbot Assistant** — intent-based nav help / FAQ / session
   recommendations. ✅ built as a **deterministic** rule-based intent matcher
   (`src/lib/chatbot/`) — tokenise + keyword/synonym/regex scoring with
   typo tolerance and a confidence gate, **no LLM**. ~35 role-aware intents,
   a 26-entry FAQ knowledge base, a per-portal `ChatWidget`, unmatched-query
   logging (`ChatbotMiss`) reviewed at `/admin/chatbot`. Kill switch:
   `chatbotEnabled`. See `docs/reference/chatbot.md`.
6. **Analytics Dashboard** — admin-facing aggregate stats (users, classes,
   certifications, enrollment trend) and an audit log of moderation actions.
   ✅ built.

## Explicit delimitations (do not build these)

- No file upload for learning materials — tutoring happens on school
  premises; there is intentionally no upload/storage feature.
- Chatbot is nav/FAQ/recommendation only — never a replacement for actual
  tutoring, no free-form generative chat.
- Analytics stays descriptive (counts, breakdowns, graphs) — no ML,
  prediction, or educational data mining.
- No payments/monetization anywhere.

## Domain vocabulary

- **Subjects & topics** — admin-editable `Subject` / `Topic` tables
  (`/admin/subjects`), managed since 2026-09-04. The `SubjectArea` enum was
  removed; every `subject` column is now a plain `String` storing
  `Subject.slug` (slugs match the old enum values — `MATH`, `ENGLISH`,
  `SCIENCE`, `FILIPINO`, `ARALING_PANLIPUNAN`, `TLE`, `MAPEH` — as seeded).
  Validate with `subjectExists()` / `topicExists()` from `src/lib/subjects.ts`
  (cached; falls back to the static `SUBJECT_TOPICS` map in
  `src/lib/subjectTopics.ts` when the DB is unreachable, e.g. unit tests).
  Topics stay denormalised as strings on child rows; `Topic` is the editable
  catalogue + validation source. See `docs/reference/decisions.md`.
- **Grade levels**: `GRADE_7`..`GRADE_12`.
- **Class vs. session**: a `TutorClass` is a course container (subject,
  topics, capacity, one roster); a `ClassSession` is one scheduled meeting
  within it, tackling one of the class's topics. A class can be 1-on-1
  (`maxStudents: 1`) or group.
- **Topic certification**: per-(tutor, subject, topic) qualification state
  (`PENDING` → `CERTIFIED`/`REJECTED`), earned by passing an
  `AssessmentAttempt` quiz for that topic.
- **Topic request**: a learner-posted "I need help with X, here's my
  availability and preferred setup" ticket, used when no existing class is a
  good match; a tutor can fulfill it by attaching a class.

## Stack quick-reference

See `CLAUDE.md` for the authoritative, maintained version (tech stack table,
project structure, coding conventions, RBAC/API patterns). Don't duplicate
that content here — this file is domain/business context, `CLAUDE.md` is
engineering convention.
