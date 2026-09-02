# Class Pre/Post Tests — tutor-built, bank + custom questions, learner-taken

## Context

The assessment system (admin question bank + tutor auto-graded certification quizzes)
is merged to `main`. This feature adds a **second use of that machinery aimed at
learners**: a tutor builds a **pre-test** and a **post-test** for one of their
classes, drawing questions from the **admin question bank** and/or **writing their
own**; enrolled **learners take each test once**; the tutor, the learner (own
only), and admins can see results and the **pre→post improvement**.

Diagnostic only — score % and correct count are recorded, no pass/fail gate.

### Decisions locked with the user

| Question | Answer |
|---|---|
| Scope | **One PRE + one POST per class** (`@@unique([classId, kind])`) |
| Retakes | **Single attempt per learner per test** (`@@unique([classTestId, learnerId])`, no retake route) |
| Results visible to | **Tutor** (all learners), **Learner** (own only), **Admin** (read-only pages) |
| Scoring | **Diagnostic only** — no pass mark; attempt status is `IN_PROGRESS` / `SUBMITTED` |

### Reused building blocks

- `AssessmentQuestion` / `AssessmentOption` (`prisma/schema.prisma`) — question model; `createdBy` is already `User`, so a tutor authoring questions fits. Add an `origin` discriminator (below).
- `src/lib/validations/assessment.ts` — `createAssessmentQuestionSchema` (2–6 options, exactly one correct), `submitAssessmentSchema` (`{ answers: [{questionId, optionId}] }`) — reused as-is.
- `src/app/api/tutor/assessments/[attemptId]/submit/route.ts` — grading logic pattern (per-item match → `correctCount`, `scorePercent = round(correct/total*100)`).
- `src/lib/assessmentSerialize.ts` — pattern for the `reveal`-gated attempt DTO (parallel file for class tests).
- `src/components/tutor/AssessmentQuizRunner.tsx` — quiz-taking UI pattern.
- `QuestionFormModal` (currently inline in `src/components/admin/QuestionBankManager.tsx`) — the add/edit-question form; **extract to a shared component** and reuse for tutor authoring.
- `src/components/classes/ClassDetailsView.tsx` — already slot-based (`sessions`, `roster`, `sidebarExtra`, `actions`); add a `tests` slot.
- Ownership / RBAC patterns in `src/app/api/tutor/classes/[classId]/sessions/route.ts` and enrollment checks in `src/app/api/classes/[classId]/enroll/route.ts`.

---

## Data model (`prisma/schema.prisma`) — all additive

### New enums
```prisma
enum ClassTestKind        { PRE POST }
enum ClassTestStatus      { DRAFT PUBLISHED CLOSED }
enum ClassTestAttemptStatus { IN_PROGRESS SUBMITTED }
enum QuestionOrigin       { BANK TUTOR }   // discriminates admin bank vs tutor-authored
```

### `AssessmentQuestion` — additions (keeps one question table)
- `origin QuestionOrigin @default(BANK)` — existing rows migrate to `BANK`.
- `ownerTutorProfileId String?` + `ownerTutorProfile TutorProfile? @relation("OwnedQuestions", fields: [ownerTutorProfileId], references: [id], onDelete: Cascade)` — set only for `TUTOR` origin.
- back-relations: `classTestLinks ClassTestQuestion[]`, `classTestItems ClassTestAttemptItem[]`.
- `@@index([subject, topic, active])` → add `origin` to keep bank lookups fast: `@@index([origin, subject, topic, active])`.

**Isolation rule:** every query that means "the admin bank" must filter `origin: "BANK"`, so a
tutor's custom questions never appear in the admin Question Bank UI, the coverage
counts, or — critically — the tutor **certification** question pool. Patch:
`src/lib/assessmentPicker.ts` (`pickQuestionIds` where), `src/lib/assessmentStatus.ts`
(active-count groupBy), `src/app/api/admin/assessment-questions/route.ts` (GET where; POST sets `origin: "BANK"` explicitly),
`src/app/api/admin/assessment-questions/coverage/route.ts` (both groupBys), and
`src/app/api/admin/assessment-questions/[questionId]/route.ts` (404 if `origin !== "BANK"`).

### `ClassTest`
- `id`, `classId` → `TutorClass` (`onDelete: Cascade`)
- `kind ClassTestKind`, `title String`, `instructions String? @db.Text`
- `status ClassTestStatus @default(DRAFT)`
- `createdAt`, `updatedAt`, `publishedAt DateTime?`, `closedAt DateTime?`
- `questions ClassTestQuestion[]`, `attempts ClassTestAttempt[]`
- `@@unique([classId, kind])`, `@@map("class_tests")`

### `ClassTestQuestion` — ordered question set
- `id`, `classTestId` → `ClassTest` (`onDelete: Cascade`), `questionId` → `AssessmentQuestion`, `position Int`
- `@@unique([classTestId, position])`, `@@unique([classTestId, questionId])`, `@@map("class_test_questions")`

### `ClassTestAttempt` — a learner's run
- `id`, `classTestId` → `ClassTest` (`onDelete: Cascade`)
- `learnerId` → `User` (`@relation("LearnerClassTestAttempts")`, `onDelete: Cascade`)
- `status ClassTestAttemptStatus @default(IN_PROGRESS)`
- `totalQuestions Int`, `correctCount Int @default(0)`, `scorePercent Int @default(0)`
- `startedAt DateTime @default(now())`, `submittedAt DateTime?`
- `items ClassTestAttemptItem[]`
- `@@unique([classTestId, learnerId])`, `@@index([learnerId])`, `@@map("class_test_attempts")`

### `ClassTestAttemptItem`
- `id`, `attemptId` → `ClassTestAttempt` (`onDelete: Cascade`)
- `questionId` → `AssessmentQuestion`, `position Int`
- `selectedOptionId String?` → `AssessmentOption` (`@relation("ClassTestSelectedOption")`, `onDelete: SetNull`)
- `isCorrect Boolean?`
- `@@unique([attemptId, position])`, `@@unique([attemptId, questionId])`, `@@map("class_test_attempt_items")`

### New back-relations
`TutorClass.tests ClassTest[]` · `User.classTestAttempts ClassTestAttempt[] @relation("LearnerClassTestAttempts")` ·
`TutorProfile.ownedQuestions AssessmentQuestion[] @relation("OwnedQuestions")` ·
`AssessmentOption.classTestSelections ClassTestAttemptItem[] @relation("ClassTestSelectedOption")`

### Freezing / editing rules (enforced in routes, not the schema)
- A `ClassTest`'s meta + question set is editable only while `status = DRAFT`. `PUBLISHED` freezes it; `CLOSED` additionally stops new attempts.
- A tutor-authored `AssessmentQuestion` is editable/deletable only while it is on **no `PUBLISHED`/`CLOSED` test** and referenced by **no `ClassTestAttemptItem`**.

### Migration
`npx prisma migrate dev --name class_pre_post_tests`, then `npx prisma generate`.
Additive: new tables + enums, plus `AssessmentQuestion.origin` (defaulted) and a nullable FK. (Standing session authorization to run migrate — see `[[migrate-authorized-this-session]]`.)

---

## Shared library

- `src/lib/validations/classTest.ts` (new):
  - `createClassTestSchema` — `{ kind: z.enum(["PRE","POST"]), title: string trim 3..120, instructions?: string max 2000 }`
  - `updateClassTestSchema` — `{ title?: …, instructions?: … }`
  - `setClassTestQuestionsSchema` — `{ questionIds: z.array(z.string().min(1)).min(1).max(50) }` (array order = display order)
  - `classTestStatusSchema` — `{ status: z.enum(["PUBLISHED","CLOSED"]) }`
  - (tutor authoring reuses `createAssessmentQuestionSchema`; submit reuses `submitAssessmentSchema`)
- `src/lib/classTestSerialize.ts` (new): `serializeClassTestAttempt(attempt, { reveal })` — mirrors `serializeAttempt`; strips option `isCorrect` / `explanation` / per-item grade / score when `reveal` is false. Also `serializeClassTestForTaking(test)` — questions + options **without** correctness, for the runner.

---

## API routes — follow the house style (`getServerSession` → 401; Zod `safeParse` → 400 first issue; `try/catch` → `console.error` + 500; `$transaction` for multi-write; peer data selects only `id` + `anonymousId`)

### Tutor — build tests
| Route | Methods |
|---|---|
| `src/app/api/tutor/classes/[classId]/tests/route.ts` | `GET` this class's PRE/POST tests (+ question count, attempt count); `POST` create one (ownership check; 409 if that `kind` already exists) |
| `src/app/api/tutor/classes/[classId]/tests/[testId]/route.ts` | `GET` full test (ordered questions with options); `PATCH` title/instructions (DRAFT only); `DELETE` (DRAFT only) |
| `src/app/api/tutor/classes/[classId]/tests/[testId]/questions/route.ts` | `PUT` `setClassTestQuestionsSchema` — replace the ordered `ClassTestQuestion` set in a txn (DRAFT only; every id must be an `active` `BANK` question of the class subject **or** a `TUTOR` question owned by this tutor) |
| `src/app/api/tutor/classes/[classId]/tests/[testId]/status/route.ts` | `PATCH` `classTestStatusSchema` — `PUBLISHED` (requires ≥1 question, sets `publishedAt`) / `CLOSED` (sets `closedAt`) |
| `src/app/api/tutor/classes/[classId]/tests/[testId]/results/route.ts` | `GET` — per-enrolled-learner: pre score, post score, delta; class averages; each learner shown as `{ id, anonymousId }` |

### Tutor — question sources
| `src/app/api/tutor/question-bank/route.ts` | `GET` paginated browse of the **admin** bank (`origin: "BANK"`, `active: true`, `subject` = class subject, optional `topic`, `q`) for the picker |
| `src/app/api/tutor/questions/route.ts` | `GET` the tutor's own `TUTOR`-origin questions; `POST` author one — `createAssessmentQuestionSchema`; forces `origin: "TUTOR"`, `ownerTutorProfileId`, `createdById`; `topic` must be one of the class's topics (class id in body) |
| `src/app/api/tutor/questions/[questionId]/route.ts` | `PATCH` / `DELETE` own question — refused (409) if it is on any `PUBLISHED`/`CLOSED` test or has any `ClassTestAttemptItem` |

### Learner — take tests
| `src/app/api/learner/classes/[classId]/tests/route.ts` | `GET` — `PUBLISHED` tests for a class the caller is enrolled in, each with the caller's attempt state (`none` / `in_progress` / `submitted` + score) |
| `src/app/api/learner/classes/[classId]/tests/[testId]/start/route.ts` | `POST` — 403 if not enrolled; 400 if test not `PUBLISHED`; resume if an `IN_PROGRESS` attempt exists; 409 if a `SUBMITTED` one exists; else txn: create `ClassTestAttempt` + `ClassTestAttemptItem` rows snapshotting the test's questions in order; return questions **without** answers |
| `src/app/api/learner/class-test-attempts/[attemptId]/route.ts` | `GET` — ownership check; `IN_PROGRESS` → questions only; `SUBMITTED` → full graded review |
| `src/app/api/learner/class-test-attempts/[attemptId]/submit/route.ts` | `POST` `submitAssessmentSchema` — ownership + `IN_PROGRESS` (else 409); txn: grade each item, set `correctCount` / `scorePercent` / `status = SUBMITTED` / `submittedAt`; return review |

### Admin — read-only
| `src/app/api/admin/class-tests/route.ts` | `GET` paginated across all classes (filters: subject, kind, status, `q` = class code / tutor id); rows include class code, tutor `{ id, anonymousId }`, counts |
| `src/app/api/admin/class-tests/[testId]/results/route.ts` | `GET` — same shape as the tutor results endpoint |

---

## UI

### Shared
- `src/components/classes/ClassDetailsView.tsx` — add an optional `tests?: ReactNode` slot, rendered as a card in the main column below Sessions.
- `src/components/classes/ClassTestsCard.tsx` (new) — PRE / POST rows: status badge + a role-appropriate action (`Build` / `View results` for tutor; `Take pre-test` / `Review` for learner; `View results` for admin). Takes `tests`, `audience`, `classId`.
- Extract `QuestionFormModal` from `src/components/admin/QuestionBankManager.tsx` → `src/components/quiz/QuestionFormModal.tsx`; import it back into `QuestionBankManager` and into the tutor builder. (Refactor, no behavior change.)
- `src/components/quiz/ClassTestRunner.tsx` (new) — learner take/review UI, adapted from `AssessmentQuizRunner.tsx` but diagnostic (no pass-mark wording), back link to the learner class page. (If it drifts close to identical, extract a shared presentational `QuizRunner`; not required for v1.)

### Tutor
- `src/app/tutor/classes/[classId]/page.tsx` — fetch `class.tests`, pass `<ClassTestsCard audience="tutor" …/>` into the `tests` slot.
- `src/app/tutor/classes/[classId]/tests/[testId]/page.tsx` (new) — lean server component → `<ClassTestBuilder/>`.
- `src/components/tutor/ClassTestBuilder.tsx` (new, `"use client"`): title/instructions form; ordered question list (remove / move up-down); **Add from bank** modal (browse `/api/tutor/question-bank`, multi-select) and **Write a question** modal (`QuestionFormModal` → `POST /api/tutor/questions` → append); **My questions** list in the add modal to reuse earlier custom questions; **Publish** / **Close** buttons; everything read-only once `status !== "DRAFT"`.
- `src/app/tutor/classes/[classId]/tests/[testId]/results/page.tsx` (new) → `src/components/tutor/ClassTestResults.tsx` — table of enrolled learners × (pre %, post %, Δ), class averages, and a per-attempt drill-down modal (question, chosen answer, correct answer, explanation). Reused read-only by admin.

### Learner
- `src/app/learner/classes/[classId]/page.tsx` — fetch published tests + attempt state, pass `<ClassTestsCard audience="learner" …/>`.
- `src/app/learner/classes/[classId]/tests/[testId]/page.tsx` (new) — ownership/enrollment + `notFound()`; renders `<ClassTestRunner/>`.
- (Optional nudge on `src/app/learner/page.tsx` / my-classes — "pre-test pending". Not required for v1.)

### Admin
- `src/app/admin/layout.tsx` — add `{ label: "Class Tests", href: "/admin/class-tests", icon: <ClipboardList/>, group: "Review" }`.
- `src/app/admin/class-tests/page.tsx` (new) + `src/components/admin/ClassTestsTable.tsx` (new) — paginated list (`usePaginatedList`), row → results (reuse `ClassTestResults` in a read-only mode or a modal).

---

## Seed (`prisma/seed.ts`)

For one curated class on MATH "Algebraic Expressions": create a **PRE** test and a **POST**
test (both `PUBLISHED`, 5 bank questions each), author **one `TUTOR`-origin question** and add it
to the POST test, and give 2 enrolled learners a submitted PRE attempt each (one also a POST
attempt) so the results view shows a pre→post delta. Guard with the existing seed structure;
re-runnable (delete this class's `ClassTest` rows first).

---

## Tests (Vitest, `__tests__/` beside each route; mock `@/lib/prisma` + `getServerSession`)

- `api/tutor/classes/[classId]/tests` — create: RBAC, class ownership, 409 duplicate `kind`; list shape.
- `.../tests/[testId]/questions` PUT — replaces the set in DRAFT; 409 when `PUBLISHED`; rejects a bank question of the wrong subject and a `TUTOR` question owned by someone else.
- `.../tests/[testId]/status` PATCH — `PUBLISHED` refused with 0 questions; `CLOSED` sets `closedAt`.
- `api/tutor/questions` — POST forces `origin: "TUTOR"` + `ownerTutorProfileId`; GET returns only the caller's.
- `lib/__tests__/assessmentPicker.test.ts` — extend: a `TUTOR`-origin question in the topic is **not** picked for a certification attempt (`origin: "BANK"` filter).
- `api/learner/classes/[classId]/tests/[testId]/start` — 403 not enrolled, 400 not published, resume `IN_PROGRESS`, 409 after `SUBMITTED`, snapshots N items.
- `api/learner/class-test-attempts/[attemptId]/submit` — grading math, `SUBMITTED`, ownership 404, double-submit 409.
- `api/admin/class-tests` — RBAC + list.

---

## Verification (end-to-end)

1. `npx prisma migrate dev --name class_pre_post_tests`; `npx prisma generate`; `pnpm exec tsx prisma/seed.ts`.
2. `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test` (expect the existing 352 + the new files green); `pnpm build`.
3. `pnpm dev`:
   - Tutor → a class → **Tests** → build the POST test: add 3 questions from the bank, write 1 custom question, reorder, **Publish**.
   - Confirm the custom question does **not** show in Admin → Question Bank, the coverage counts, or a fresh tutor certification quiz for that topic.
   - Learner (enrolled) → same class → **Take pre-test** → submit → sees own score + right/wrong + explanations; **Take post-test** likewise; second attempt on either is blocked.
   - Tutor → class → **Tests → View results**: per-learner pre %, post %, Δ, class averages, drill-down.
   - Admin → **Class Tests** → open the same test's results (read-only).

---

## Files (summary)

**Schema/lib (new):** `src/lib/validations/classTest.ts`, `src/lib/classTestSerialize.ts`.
**Schema/lib (edit):** `prisma/schema.prisma` (4 enums, 4 tables, `AssessmentQuestion` fields, back-relations); `src/lib/assessmentPicker.ts`, `src/lib/assessmentStatus.ts` (`origin: "BANK"` filter); `prisma/seed.ts`.
**API (new):** `src/app/api/tutor/classes/[classId]/tests/{route,[testId]/route,[testId]/questions/route,[testId]/status/route,[testId]/results/route}.ts`; `src/app/api/tutor/{question-bank/route,questions/route,questions/[questionId]/route}.ts`; `src/app/api/learner/classes/[classId]/tests/{route,[testId]/start/route}.ts`; `src/app/api/learner/class-test-attempts/[attemptId]/{route,submit/route}.ts`; `src/app/api/admin/class-tests/{route,[testId]/results/route}.ts`.
**API (edit):** `src/app/api/admin/assessment-questions/{route,coverage/route,[questionId]/route}.ts` (`origin: "BANK"`).
**UI (new):** `src/components/classes/ClassTestsCard.tsx`; `src/components/quiz/{QuestionFormModal,ClassTestRunner}.tsx`; `src/components/tutor/{ClassTestBuilder,ClassTestResults}.tsx`; `src/components/admin/ClassTestsTable.tsx`; `src/app/tutor/classes/[classId]/tests/[testId]/{page,results/page}.tsx`; `src/app/learner/classes/[classId]/tests/[testId]/page.tsx`; `src/app/admin/class-tests/page.tsx`.
**UI (edit):** `src/components/classes/ClassDetailsView.tsx` (`tests` slot); `src/components/admin/QuestionBankManager.tsx` (use extracted `QuestionFormModal`); `src/app/tutor/classes/[classId]/page.tsx`; `src/app/learner/classes/[classId]/page.tsx`; `src/app/admin/layout.tsx`.
**Tests (new):** as listed above.
**Docs:** append a "Part 5" section to `Changes.txt` (per CLAUDE.md); copy this plan to `docs/plans/class-pre-post-tests.md`.
