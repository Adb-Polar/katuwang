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

- **Chatbot Assistant module** — zero code exists (`intent`, `chatbot`,
  `faq` all return no hits in `src/`). Entire module 5 of 6 is unstarted.
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

## How to add a new entry here

When a decision is made that contradicts or supersedes something in the
thesis reference doc, add a new `##` section above (newest first) with:
**Decision**, **Thesis text says otherwise** (quote or paraphrase + location
if relevant), **Why** (who decided, when, and the reason given), and
**Implication for agents** (the concrete "don't do X" or "do Y instead").
