# Per-Session Pre/Post-Test Assessment

## Context

Thesis module 4 requires pre- and post-tests "administered **prior to and following each
tutoring session**" to measure learning progress. On `main` this is unbuilt: `AssessmentAttempt`
is hard-bound to `tutorProfileId` and serves only tutor certification quizzes.

An unmerged branch `class-pre-post-tests` (`1b6662c`, 55 files, +5146/−200, 8 test files)
already built the machinery — tutor test builder, bank + custom questions, learner
take/resume/review, grading, admin read-only views. It is 21 commits stale and has three gaps
against what's needed:

1. **Wrong grain** — one PRE + one POST test per **class** (`@@unique([classId, kind])`), not
   per session. A divergence from the thesis.
2. **No charts at all** — `ClassTestResults.tsx` contains zero chart markup; it's tables and
   numbers.
3. **No learner progress view** — a learner sees only "scored X%" on a card.

This plan re-grains the branch onto `ClassSession`, adds the four charts, and adds a learner
progress surface.

### Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Branch | **Adapt it**, don't rebuild — the API/lib/test layers largely survive |
| Question set | **One set per session, served twice** (as PRE, then as POST) |
| Learner progress | **Both** the class detail page **and** a new "My Progress" page |
| Charts | **All four** — pre-vs-post per session, learner over time, per-question rate, per-learner delta |

### Two structural corrections beyond re-graining

**One set, served twice.** `SessionTest` is unique per session and holds the ordered question
set; `kind: PRE | POST` moves **down onto the attempt**. This is strictly better than the
branch's two-sibling-tests model: it deletes the sibling lookup, makes the delta a same-row-pair
computation, and — critically — makes **per-question pre-vs-post comparison possible at all**,
because `position` is guaranteed to reference the same question in both runs. Under the branch's
model, PRE question #3 and POST question #3 were unrelated.

**Question-bank isolation.** `AssessmentQuestion.origin` must be honoured by *every* bank
consumer or tutor-authored questions leak into the certification pool. The branch patched five
call sites and **missed one** — see the ⚠️ in §5.

---

## 1. Schema *(needs explicit DB confirmation per CLAUDE.md)*

Four new models + four enums, plus three fields on `AssessmentQuestion`. All additive.

```prisma
enum QuestionOrigin           { BANK  TUTOR }
enum SessionTestStatus        { DRAFT  PUBLISHED  CLOSED }
enum SessionTestKind          { PRE  POST }
enum SessionTestAttemptStatus { IN_PROGRESS  SUBMITTED }

model SessionTest {              // exactly one per session
  id           String            @id @default(cuid())
  sessionId    String            @unique
  session      ClassSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  title        String
  instructions String?           @db.Text
  status       SessionTestStatus @default(DRAFT)
  publishedAt  DateTime?
  closedAt     DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  questions    SessionTestQuestion[]
  attempts     SessionTestAttempt[]
  @@index([status])
  @@map("session_tests")
}

model SessionTestQuestion {      // ordered set, shared by both runs
  sessionTestId String; questionId String; position Int
  @@unique([sessionTestId, position])
  @@unique([sessionTestId, questionId])
  @@map("session_test_questions")
}

model SessionTestAttempt {       // `kind` lives HERE, not on the test
  sessionTestId String; learnerId String; kind SessionTestKind
  status SessionTestAttemptStatus @default(IN_PROGRESS)
  totalQuestions Int; correctCount Int @default(0); scorePercent Int @default(0)
  startedAt DateTime @default(now()); submittedAt DateTime?
  @@unique([sessionTestId, learnerId, kind])   // one PRE + one POST per learner
  @@index([learnerId, kind])
  @@index([sessionTestId, kind, status])
  @@map("session_test_attempts")
}

model SessionTestAttemptItem {   // position = the pre/post join key
  attemptId String; questionId String; position Int
  selectedOptionId String?; isCorrect Boolean?
  @@unique([attemptId, position])
  @@unique([attemptId, questionId])
  @@map("session_test_attempt_items")
}
```

Full field lists + relation attributes follow the branch's equivalents (`git show
class-pre-post-tests:prisma/schema.prisma`), renamed.

**On `AssessmentQuestion`** — add `origin QuestionOrigin @default(BANK)`,
`ownerTutorProfileId String?` + `ownerTutorProfile TutorProfile? @relation("OwnedQuestions",
onDelete: Cascade)`, back-relations `sessionTestLinks` / `sessionTestItems`, and:

```prisma
@@index([subject, topic, active, origin])   // NOT the branch's [origin, subject, topic, active]
@@index([ownerTutorProfileId])
```

> **Index correction.** The branch led the index with `origin` (cardinality 2). Three queries
> added to `main` *after* the branch was cut filter on `(subject)` / `(subject, topic)` with no
> `origin` — `admin/subjects/[id]/route.ts:16`, `admin/topics/[id]/route.ts:18,39`. Leading with
> `origin` breaks their usable prefix. Appending it fourth keeps every existing query on a prefix.

**Back-relations:** `ClassSession.test SessionTest?`, `User.sessionTestAttempts`,
`TutorProfile.ownedQuestions`, `AssessmentOption.sessionTestSelections`. **No** `TutorClass.tests`
— class roll-ups reach tests via `sessions.test`.

**3NF note:** `totalQuestions` / `correctCount` / `scorePercent` are frozen snapshots, matching
the existing `AssessmentAttempt` convention. Safe because the question set is immutable once any
attempt exists (§3 guard).

**`origin` back-fill:** none needed — `DEFAULT 'BANK'` is correct for all existing rows (all
admin-authored). Verify: `SELECT origin, COUNT(*) FROM assessment_questions GROUP BY origin;`

**Reuse `AssessmentQuestion`/`AssessmentOption`; do NOT reuse `AssessmentAttemptItem`** — its
`attemptId` FKs the tutor-scoped `assessment_attempts` with `@@unique([tutorProfileId, subject,
topic, attemptNo])`. Bending it would need a polymorphic FK or a nullable `tutorProfileId`,
invalidating the unique key and every certification query. A separate table has zero blast radius
on the working flow; the duplicated grading loop is factored into `gradeAttempt.ts`.

### Migration — history is drifted

`prisma/migrations/` does **not** describe the live DB: main's Subject/Topic refactor went in via
`db push` with no migration file. **A bare `prisma migrate dev` will offer to reset the database.**
`prisma migrate status` currently reports "up to date" only because the schema and DB agree, not
because the history does.

- **Option 1 — `db push`** (matches Parts 17/19/22/23/25). Additive, no reset. History stays drifted.
- **Option 2 — reconcile first (recommended):** hand-write a baseline migration for the
  Subject/Topic DDL → `prisma migrate resolve --applied <name>` → then a real
  `migrate dev --name session_pre_post_tests`. ~30 min, restores a defensible history.

Delete the branch's `prisma/migrations/20260902081727_class_pre_post_tests/` — wrong timestamp
ordering, wrong model names, references dropped `SubjectArea` columns.

**Standing instruction** (`decisions.md`): if drift appears, stop and ask — do not resolve it
unilaterally mid-task.

### Feature flag

`sessionTestsEnabled` in `PLATFORM_SETTING_KEYS` + `DEFAULTS` (`src/lib/settings.ts`) — two lines,
no migration. Toggle in `PlatformSettingsForm` "General". When off: create/publish 403s, learner
surfaces hide, collected data stays readable.

---

## 2. Gating — kind ⇄ session status

| `ClassSession.status` | PRE | POST |
|---|---|---|
| `SCHEDULED` | **allowed** | `409 POST_NOT_OPEN` |
| `COMPLETED` | new starts `409 PRE_WINDOW_CLOSED`; an existing `IN_PROGRESS` may still be submitted | **allowed** |
| `CANCELLED` | no new starts (`409 SESSION_CANCELLED`); in-progress may submit; review readable | same |

Only **starting** is gated — a learner who opened the pre-test seconds before the tutor hit
"Mark Complete" must not lose their work.

**No PRE→POST prerequisite.** A late-enrolling learner can take the post-test alone; `delta` is
`null` and they're excluded from `pairedCount`. Requiring the pre-test would drop them from the
post-test entirely — worse for the learner and the data.

Learner start-route ladder: 401 wrong role → 403 flag off → 404 bad kind → 404 class → 403 not
enrolled → 403 class SUSPENDED/BANNED → 404 session not in class → **404 if test is DRAFT**
(indistinguishable from absent) → 409 CLOSED → 409 per the table → 409 already SUBMITTED → 200
resume → 201 create.

Submit: 404 if not the caller's attempt (not 403 — don't confirm the id), 409 re-submit, 400 bad
body, 200 with `reveal: true`.

---

## 3. Routes

New `src/lib/validations/sessionTest.ts` (from the branch's `classTest.ts`, `kind` removed);
submission reuses main's existing `submitAssessmentSchema`.

**Tutor** — all under `/api/tutor/classes/[classId]/sessions/[sessionId]/test`:
`GET` (test + session + attemptCount), `POST` create, `PATCH` metadata, `DELETE`,
`PUT /questions`, `PATCH /status`, `GET /results`, `GET /attempts/[attemptId]`.
Plus `GET /api/tutor/classes/[classId]/test-results` (class roll-up),
`GET /api/tutor/question-bank`, and `GET|POST /api/tutor/questions` +
`PATCH|DELETE /api/tutor/questions/[questionId]`.

**Learner:** `GET /api/learner/classes/[classId]/session-tests`,
`POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start`,
`GET|POST /api/learner/session-test-attempts/[attemptId]{,/submit}`,
`GET /api/learner/progress?classId=`.

**Admin (read-only):** `GET /api/admin/session-tests`, `/[testId]/results`,
`/[testId]/attempts/[attemptId]`.

Mutation guards: question set editable only while `DRAFT` **and** `_count.attempts === 0`;
publish needs ≥1 question; close needs `PUBLISHED`; delete needs zero attempts; tutor questions
are locked once on a published test.

**Shared libs** (adapted from the branch): `sessionTestAccess.ts` (adds `loadOwnedSession`,
`loadEnrolledSession`; folds the SUSPENDED/BANNED check into `loadOwnedClass`),
`sessionTestSerialize.ts` (already types `subject: string` — zero SubjectArea work; keeps the
absent-key `reveal` discipline), `sessionTestResults.ts` (**rewritten**),
`gradeAttempt.ts` (**new** — extracts the grading arithmetic so certification and session tests
share one rule).

**Notifications** (additive union members, free-text column): `SESSION_PRETEST_OPEN` on publish;
`SESSION_POSTTEST_OPEN` when a session flips `SCHEDULED → COMPLETED` and has a published test
(small edit to `sessions/[sessionId]/route.ts` to wrap the update in a `$transaction`).
Deliberately **no** per-submission tutor notification — that's 12 notifications per session.

---

## 4. Analytics — 4 charts, 3 routes

All averages `Math.round`; "no data" is `null`, never `0`, so charts render gaps not fake zeros.

| Chart | Route | Payload |
|---|---|---|
| **(a)** pre-vs-post per session (grouped bars) | `GET /api/tutor/classes/[classId]/test-results` | `sessions[]` with `avgPre`, `avgPost`, `avgDelta`, `pairedCount` + `totals` |
| **(b)** learner over time (area) | `GET /api/learner/progress` | `series[]` one row per session (`preScore`, `postScore`, `delta`, `scheduledAt`) + `summary` |
| **(c)** per-question correct rate | `GET …/test/results` | `questions[]` with `pre{answered,correct,correctRate}`, `post{…}`, `deltaRate` |
| **(d)** per-learner delta | same route | `learners[]` — `anonymousId`, `pre`, `post`, `delta`; includes never-attempted learners with nulls |

**`avgDelta` is the mean of per-learner deltas over `pairedCount` only** — *not* `avgPost − avgPre`.
Return both plus `pairedCount`; label the UI "average gain (n paired learners)". This is the
number the thesis will quote.

`deltaRate` per question is only meaningful **because both runs serve the same question at the
same position** — the payoff of decision 2.

Sort the learner progress series **in JS**, not Prisma — ordering through two nested to-one
relations (`sessionTest.session.scheduledAt`) is fragile.

### Double-blind (RA 10173)

- **Learners → tutor/admin:** return `anonymousId` + opaque `attemptId` only. `learner.id` is a
  server-side Map key and is stripped. *This is a fix* — the branch's `buildClassTestResults`
  returned `l.id`.
- **Tutor → learner:** progress payloads carry `classCode`, `subject`, `topic`, `scheduledAt` —
  **no tutor identity**. Don't add a `tutorName` field.
- **No cohort stats on the learner side.** In a 1-on-1 or 3-learner class, "class average" is a
  de-anonymisation oracle. Learners see only their own series.
- Verification greps for `firstName|lastName` in the new files.

---

## 5. ⚠️ Question-origin isolation (correctness-critical)

Port the branch's five `origin: "BANK"` filters **and add the one it missed**:

| File | Change |
|---|---|
| `src/lib/assessmentPicker.ts` | `origin: "BANK"` in the pool query *(branch)* |
| `src/lib/assessmentStatus.ts` | same on the `groupBy` *(branch)* |
| `api/admin/assessment-questions/route.ts` | GET `where` + POST `create` *(branch)* |
| `api/admin/assessment-questions/coverage/route.ts` | `where` *(branch)* |
| `api/admin/assessment-questions/[questionId]/route.ts` | `findFirst({ origin: "BANK" })`; `inUse` also counts `sessionTestItems` *(branch)* |
| **`api/tutor/assessments/route.ts`** (the `activeCount` gate) | **⚠️ MISSED BY THE BRANCH — verified.** `pickQuestionIds` filters to BANK but this count does not, so a tutor could author 20 custom questions to clear `minBankSize` and unlock their own certification quiz on a topic with a nearly-empty admin bank. |

Leave `admin/topics/[id]` and `admin/subjects/[id]` **unfiltered** (with a comment): a topic
rename must reach tutor questions too, and tutor questions should still block a topic delete.

---

## 6. UI

**Phase 0 — extract charts.** `recharts@^3.10.1` is already a production dep, used only by
`ReportsView.tsx`, whose `useThemeColors` / `BarChartCard` / `DataTable` are private. Move them to
`src/components/charts/` (widen the colour hook to read `--color-accent|success|error`), add
`GroupedBarChart`, `ProgressAreaChart`, `RateBarChart`, and `DeltaBar` (pure CSS + the existing
unused `.kt-delta` ▲/▼ badge — exactly what it was built for). `ReportsView` imports back; keep
the `<details>Show data table</details>` a11y pattern. Delete the dead `.kt-chart-plot` /
`.kt-chart-bar` rules.

| Component | Disposition |
|---|---|
| `SessionTestBuilder` | adapt `ClassTestBuilder` (637L) — drop `kind`, subject `<select>` → `useSubjectCatalog()` |
| `SessionTestResults` | rewrite `ClassTestResults` — new payload + charts (a)(c)(d) |
| `ClassProgressPanel` | **new** — chart (a) on the tutor class page |
| `SessionTestsCard` | adapt `ClassTestsCard` — 2-row PRE/POST → per-session list; keeps `audience` prop |
| `SessionTestRunner` | adapt `ClassTestRunner` — kind-aware; POST review shows the delta |
| `MyProgressView` | **new** — chart (b) + summary + class filter; reused compact on the class page |
| `SessionTestsTable` | adapt `ClassTestsTable` — `SUBJECT_TOPICS`/`SubjectArea[]` → `useSubjectCatalog()`, add `SortableTh` |
| `QuestionFormModal` | apply clean from the branch (new file, no conflict) |
| `QuestionBankManager` | **re-do the extraction on MAIN's 1175-line version** — delete the local modal, import the shared one. Never take the branch's copy. |

Mount points already exist: `SessionsList` has `renderActions?: (session) => ReactNode` (used for
take/results links), and `ClassDetailsView` is slot-based — add one optional `belowRoster` slot.

New pages: tutor builder + results, learner runner, `/learner/progress`, `/admin/session-tests`.
Nav: "My Progress" (learner, Main menu), "Session Tests" (admin, Assessment group).

**Fix while adapting:** the branch's learner test page *duplicates* the `/start` route's
attempt-creation logic inline — two paths to keep in sync. Consolidate on the route.

---

## 7. Branch disposition

- **Apply clean:** `QuestionFormModal`, `api/tutor/questions/{route,[questionId]}` + its test.
- **Adapt (re-grain):** `sessionTestAccess`, `sessionTestSerialize`, all tutor/learner/admin
  routes, `SessionTestBuilder`, `SessionTestsCard`, `SessionTestRunner`, `SessionTestsTable`,
  the `ClassDetailsView` slot, the 4 branch route tests.
- **Rewrite:** `classTestResults.ts` → `sessionTestResults.ts`; `ClassTestResults.tsx`;
  `QuestionBankManager.tsx` (both sides rewrote it); `prisma/seed.ts` (take main's, add
  `seedSessionTests()`).
- **Drop:** the branch migration, `Changes.txt`, `docs/plans/class-pre-post-tests.md` (keep a
  pointer as the superseded per-class design), `TutorClass.tests`.

**Fix the 3 `SubjectArea` sites** (verified): `api/tutor/question-bank/route.ts`,
`api/admin/class-tests/route.ts`, `components/admin/ClassTestsTable.tsx`. All become plain string
filters — main's slugs are the same uppercase values the enum used, so **no data migration**.

---

## 8. Tests

New: `sessionTestResults`, `sessionTestSerialize`, `sessionTestAccess`, `gradeAttempt` (lib);
tutor test CRUD / questions / status / results / roll-up; learner start (**one case per row of
the §2 ladder**), session-tests list, submit, progress; admin list.

Updated: `assessmentPicker` (+`origin: "BANK"` assertion), `admin/assessment-questions` ×2,
sessions `[sessionId]` (post-test notification), and **`tutor/assessments` — a new case asserting
the `activeCount` query filters `origin: "BANK"`**, guarding §5.

Assert throughout: `reveal:false` → `.not.toHaveProperty(...)`; results rows have **no** `id`;
`avgDelta ≠ avgPost − avgPre` when unpaired learners exist. Target ~478 → **560+**.

---

## 9. Phases

Each boundary leaves `tsc` + `lint` + `test` green.

0. **Charts extraction** — no feature code, no schema. Ships value standalone.
1. **Schema + generate** *(DB confirmation gate)*.
2. **Origin isolation** — the 6 filters, tutor question CRUD, `QuestionFormModal`, bank re-extraction.
3. **Backend: libs + tutor routes.**
4. **Backend: learner + admin routes**, notification hook, feature flag.
5. **Tutor UI** — builder, results + charts (a)(c)(d), class panel.
6. **Learner + admin UI** — runner, My Progress + chart (b), admin table, settings toggle.
7. **Seed + docs.**

## 10. Verification

```bash
npx prisma generate && pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
pnpm exec tsx prisma/seed.ts                      # DB confirmation
grep -rn "firstName\|lastName" src/lib/sessionTestResults.ts src/app/api/learner/progress   # must be empty
grep -rn "assessmentQuestion\." src --include=*.ts | grep -v __tests__   # each hit needs an origin filter or a comment
```

Manual smoke (each becomes a `docs/TOTEST.txt` `[ ]`): build + publish a test → learners notified
→ learner takes pre-test → post-test blocked while SCHEDULED → tutor marks COMPLETED → learners
notified, pre-test entry gone, post-test appears → learner submits, sees score **and** delta →
re-open shows review only → tutor results show all three charts, never-taken learners as dashes →
class roll-up shows a session without a test as a gap not a zero → My Progress shows the series
with **no tutor name and no class average** → question set locked after publish → CANCELLED
session blocks new attempts → admin list + `sessionTestsEnabled` toggle → **regressions:**
certification quiz still serves bank-only and still fires `BANK_NOT_READY` on a thin topic even
with 20 tutor-authored questions; question-bank modal and `/admin/reports` unchanged.

## 11. Docs

`docs/plans/session-pre-post-tests.md` (this plan) + `plans/README.md` row; `Changes.md` Part;
`docs/TOTEST.txt`; `docs/feature-checklist.md` §4 rows 78–79 ⚠️→✅, line 127, and drop the
"decide whether to merge the branch" gap on line 131; **`docs/reference/decisions.md` — two new
entries**: (1) pre/post are scoped **per session, not per class** (the branch model is superseded,
do not revive), (2) **one question set served twice**, with the implication that the randomising
`pickQuestionIds()` must never be wired into session tests. Role docs for all three roles.
`docs/erd.md` regenerates on `prisma generate`.

**No commits, no pushes, no `db push`/`migrate` without explicit confirmation.**

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Migration drift → `migrate dev` offers a reset | **High** | Never run bare `migrate dev`; §1 Option 2; owner confirms |
| Certification contamination via the missed `origin` gate | **High** | Fixed in Phase 2 + regression test + grep |
| Question set edited between PRE and POST invalidates every delta | **High** | Hard guard: edits need `DRAFT` **and** zero attempts; tested |
| `QuestionBankManager` both-sides rewrite | Medium | Re-extract on main's file; never checkout the branch copy |
| Index prefix regression | Medium | `[subject, topic, active, origin]`, verified against the 3 newer queries |
| `avgDelta` misread as `avgPost − avgPre` | Medium | Return `pairedCount`; label the UI; assert in a test |
| `pickQuestionIds` misuse (it randomises) | Medium | Session tests use the tutor's ordered rows; recorded in `decisions.md` |
| Double-blind leak (branch returned `learner.id`) | Medium | `anonymousId` only; test asserts `id` absent; grep in verification |
| recharts on learner pages | Low | Already a dep; keep chart components leaf-level `"use client"` |
