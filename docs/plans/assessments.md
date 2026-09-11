# Assessments — consolidated plan

> Merged 2026-09-10 from three separate plan docs:
> `assessment-taking-system.md` (admin question bank + auto-graded topic quizzes),
> `global-assessment-config.md` (per-topic config → one global config), and
> `pre-test-post-test-plan.md` (learner per-session pre/post tests — now also in
> `../archive/plans/` as the historical original). Each section is the source doc
> verbatim apart from headings demoted one level and links to relocated docs
> repointed (`docs/TODO.txt` → `docs/backlog/`, `docs/feature-checklist.md` /
> `docs/erd.md` → `docs/reference/`).

## Contents

1. [Assessment-Taking System (Question Bank + Auto-Graded Topic Quizzes)](#assessment-taking-system-question-bank--auto-graded-topic-quizzes)
2. [Global assessment config (replace per-topic config)](#global-assessment-config-replace-per-topic-config)
3. [Per-Session Pre/Post-Test Assessment](#per-session-prepost-test-assessment)


---

## Assessment-Taking System (Question Bank + Auto-Graded Topic Quizzes)

> _(Original plan-mode note: on approval, copy to `docs/plans/`; no commits/pushes;
> the Prisma migration is a DB modification needing explicit confirmation. The
> question-bank work has since shipped — see Changes.md.)_

### Context

Katuwang already has a **manual** topic-certification flow: a tutor clicks "Request Assessment"
for a topic they teach (`src/components/tutor/TopicCertificationList.tsx` → `POST /api/tutor/topic-certifications`),
which creates a `TopicCertification` row with status `PENDING`; an admin then manually marks it
`CERTIFIED` / `REJECTED` in `src/components/admin/CertificationReviewTable.tsx`. There is **no actual quiz** —
the UI copy even says "assessment grading is rolling out".

This plan builds the real thing:

- **Admin** maintains a **question bank** of single-answer multiple-choice questions, organised by
  `SubjectArea` + topic (topics come from the existing catalog in `src/lib/subjectTopics.ts`).
- When a **tutor** starts an assessment for a topic, the system **auto-selects** questions from that
  topic's bank and serves a quiz. Answers are **auto-graded** on submit.
- If a topic's bank is too small to run an assessment, the tutor can **request the admin to add questions**;
  admins see these requests in a queue.
- Every attempt is **persisted with the exact questions asked and the tutor's answers**, viewable by both
  the **tutor** (their own) and **admins** (all).
- **Retakes prefer questions the tutor has not seen** in their previous attempt for that topic, so attempt 2
  differs from attempt 1 (best-effort; falls back to reuse when the bank is small).

#### Decisions locked with the user

| Topic | Decision |
|---|---|
| Pass outcome | New **platform setting** `autoCertifyOnAssessmentPass` (default **off**). ON → a passing quiz sets `TopicCertification` to `CERTIFIED` automatically. OFF → a passing quiz creates a `PENDING` certification carrying the score, and the admin confirms it on the existing Certifications screen. |
| Question format | **Single-answer multiple choice only** (2–6 options, exactly one correct). Other types out of scope. |
| Retake variety | **Best-effort**: picker prefers questions absent from the tutor's last attempt for that topic; reuses when the pool is too small. |
| Quiz config | **Per-topic, admin-configurable**: `questionCount`, `passPercent`, `minBankSize` per `subject+topic`, falling back to global defaults when unset. |

---

### Data model (Prisma) — all additive

New file changes in `prisma/schema.prisma`. No existing columns change; only new models + new back-relations
on `User` and `TutorProfile`, and two new enums.

```prisma
enum AssessmentAttemptStatus { IN_PROGRESS PASSED FAILED }
enum QuestionRequestStatus   { OPEN RESOLVED DISMISSED }
```

#### `AssessmentQuestion` — the bank
- `id`, `subject SubjectArea`, `topic String`, `prompt @db.Text`, `explanation String? @db.Text`
- `active Boolean @default(true)` — soft-retire; rows referenced by an attempt are never hard-deleted
- `createdById` → `User` (`@relation("AuthoredQuestions")`), `createdAt`, `updatedAt`
- children: `options AssessmentOption[]`, `attemptItems AssessmentAttemptItem[]`
- `@@index([subject, topic, active])`, `@@map("assessment_questions")`

#### `AssessmentOption` — choices (3NF child, not a JSON blob)
- `id`, `questionId` → `AssessmentQuestion` (`onDelete: Cascade`)
- `text @db.Text`, `isCorrect Boolean @default(false)`, `position Int`
- `@@unique([questionId, position])`, `@@map("assessment_options")`

**Immutability rule (keeps attempts accurate without snapshot columns):** once a question has any
`AssessmentAttemptItem`, admins may only toggle `active` — prompt/options/correctness become read-only.
Editing is unrestricted before first use. Enforced in the PATCH route and reflected in the UI
(disabled "Edit" with a tooltip: "In use — retire and recreate to change").

#### `TopicAssessmentConfig` — per-topic tuning
- `id`, `subject SubjectArea`, `topic String`
- `questionCount Int @default(5)`, `passPercent Int @default(80)`, `minBankSize Int @default(5)`
- `updatedById String?` → `User` (`@relation("UpdatedAssessmentConfigs")`), `updatedAt`
- `@@unique([subject, topic])`, `@@map("topic_assessment_configs")`
- Missing row ⇒ global defaults from `src/lib/assessmentConfig.ts`.

#### `AssessmentAttempt` — saved result
- `id`, `tutorProfileId` → `TutorProfile` (`onDelete: Cascade`), `subject`, `topic`
- `attemptNo Int`, `status AssessmentAttemptStatus @default(IN_PROGRESS)`
- `questionCount Int`, `correctCount Int @default(0)`, `scorePercent Int @default(0)`, `passPercent Int` (snapshot at start)
- `startedAt`, `submittedAt DateTime?`
- children: `items AssessmentAttemptItem[]`
- `@@unique([tutorProfileId, subject, topic, attemptNo])`, `@@index([tutorProfileId, subject, topic])`, `@@index([status])`, `@@map("assessment_attempts")`

#### `AssessmentAttemptItem` — questions asked + tutor's answer
- `id`, `attemptId` → `AssessmentAttempt` (`onDelete: Cascade`)
- `questionId` → `AssessmentQuestion` (restrict delete), `position Int`
- `selectedOptionId String?` → `AssessmentOption` (`@relation("SelectedOption")`), `isCorrect Boolean?` (graded on submit)
- `@@unique([attemptId, position])`, `@@unique([attemptId, questionId])`, `@@map("assessment_attempt_items")`

#### `QuestionRequest` — tutor asks admin to add questions
- `id`, `tutorProfileId` → `TutorProfile` (`onDelete: Cascade`), `subject`, `topic`, `note String? @db.Text`
- `status QuestionRequestStatus @default(OPEN)`
- `resolvedById String?` → `User` (`@relation("ResolvedQuestionRequests")`), `resolvedAt DateTime?`, `resolutionNote String? @db.Text`
- `createdAt`, `updatedAt`
- `@@unique([tutorProfileId, subject, topic])` (re-requesting reopens the same row), `@@index([status, subject])`, `@@map("question_requests")`

#### Migration
`npx prisma migrate dev --name assessment_question_bank` then `npx prisma generate`.
**Ask the user before running** (DB modification per CLAUDE.md).

---

### Shared library code (new)

#### `src/lib/assessmentConfig.ts`
```ts
export const ASSESSMENT_DEFAULTS = { questionCount: 5, passPercent: 80, minBankSize: 5 };
export const OPTION_COUNT_MIN = 2;
export const OPTION_COUNT_MAX = 6;
export function resolveTopicConfig(row: TopicAssessmentConfig | null): typeof ASSESSMENT_DEFAULTS;
```

#### `src/lib/assessmentPicker.ts`
`pickQuestionIds(tx, { tutorProfileId, subject, topic, count }): Promise<string[]>`
1. `pool` = `active` question ids for `(subject, topic)`.
2. `seen` = question ids from the tutor's most recent submitted attempt for `(subject, topic)`.
3. `fresh = pool − seen`, `repeat = pool ∩ seen`; Fisher–Yates shuffle both.
4. Take from `fresh` first, top up from `repeat`, slice to `count`, shuffle the final list.
Guards: if `pool.length < count`, return what's available (caller already blocked via `minBankSize`).

#### `src/lib/assessmentStatus.ts`
`getTopicAssessmentStatus(tutorProfileId, taughtTopics): Map<"SUBJECT::topic", TopicAssessmentStatus>`
where `TopicAssessmentStatus = { bankReady, inProgressAttemptId, lastAttempt: { id, status, scorePercent } | null, openRequest: boolean, certificationStatus }`.
Used by the tutor Assessments page to drive per-row buttons in one query pass.

#### `src/lib/validations/assessment.ts` (new; mirrors style of `src/lib/validations/admin.ts`)
- `optionInputSchema` — `{ text: string trim 1..500, isCorrect: boolean }`
- `createAssessmentQuestionSchema` — `{ subject: nativeEnum(SubjectArea), topic: string min 1, prompt: string 5..1000, explanation?: string max 1000, options: optionInputSchema[].min(2).max(6) }` + `.refine` exactly one `isCorrect` → "Mark exactly one option correct."
- `updateAssessmentQuestionSchema` — `createAssessmentQuestionSchema.partial().extend({ active: boolean().optional() })`
- `updateTopicAssessmentConfigSchema` — `{ subject, topic: string min 1, questionCount?: int 1..50, passPercent?: int 1..100, minBankSize?: int 1..200 }`
- `startAssessmentSchema` — `{ subject: nativeEnum, topic: string min 1 }`
- `submitAssessmentSchema` — `{ answers: { questionId: string min 1, optionId: string min 1 }[].min(1).max(50) }`
- `requestQuestionsSchema` — `{ subject: nativeEnum, topic: string min 1, note?: string max 500 }`
- `resolveQuestionRequestSchema` — `{ status: enum(["RESOLVED","DISMISSED"]), resolutionNote?: string max 500 }`
- each with `export type …Input = z.infer<…>`

#### `src/lib/auditLog.ts` — add constants
`AUDIT_ACTIONS`: `QUESTION_CREATED`, `QUESTION_UPDATED`, `QUESTION_RETIRED`, `QUESTION_DELETED`,
`ASSESSMENT_CONFIG_UPDATED`, `QUESTION_REQUEST_RESOLVED`.
`AUDIT_TARGET_TYPES`: `QUESTION`, `QUESTION_REQUEST`, `ASSESSMENT_CONFIG`.

#### `src/lib/settings.ts` + `src/lib/validations/admin.ts`
Add `"autoCertifyOnAssessmentPass"` to `PLATFORM_SETTING_KEYS`, to `DEFAULTS` (`false`), and to the
`updatePlatformSettingSchema` key enum.

---

### API routes (new) — follow the pattern in `src/app/api/admin/registrations/route.ts`

Every route: `getServerSession(authOptions)` guard returning **401** `{ error: "Unauthorized." }`,
Zod `safeParse` → **400** with `issues[0].message`, `try/catch` → `console.error` + **500**
`{ error: "An unexpected error occurred." }`, multi-write in `prisma.$transaction`, list responses shaped
`{ <key>, total, page, pageSize }`. Peer-facing tutor data selects **only `id` + `anonymousId`** (RA 10173).

#### Admin — question bank
| Route | Methods |
|---|---|
| `src/app/api/admin/assessment-questions/route.ts` | `GET` paginated (`subject`, `topic`, `active`, `q`, `page`, `pageSize`; each row includes ordered `options` + `inUse`); `POST` create (validate `topic ∈ SUBJECT_TOPICS[subject]`, create question+options in txn, audit `QUESTION_CREATED`) |
| `src/app/api/admin/assessment-questions/[questionId]/route.ts` | `GET` one; `PATCH` (if `inUse` → accept only `{ active }`, audit `QUESTION_RETIRED`; else full edit replacing options in txn, audit `QUESTION_UPDATED`); `DELETE` (409 if `inUse`, else cascade-delete, audit `QUESTION_DELETED`) |
| `src/app/api/admin/assessment-questions/coverage/route.ts` | `GET` — for every `(subject, topic)` in `SUBJECT_TOPICS`: `{ subject, topic, activeCount, config, ready: activeCount >= config.minBankSize, openRequests }` |

#### Admin — per-topic config
| `src/app/api/admin/assessment-configs/route.ts` | `PATCH` — `updateTopicAssessmentConfigSchema`, upsert on `[subject, topic]`, audit `ASSESSMENT_CONFIG_UPDATED` |

#### Admin — question requests
| `src/app/api/admin/question-requests/route.ts` | `GET` paginated (`status` default `OPEN`, `subject`, `q`); tutor shown as `{ id, anonymousId }` |
| `src/app/api/admin/question-requests/[requestId]/route.ts` | `PATCH` — `resolveQuestionRequestSchema`, set `resolvedById`/`resolvedAt`, audit `QUESTION_REQUEST_RESOLVED` |

#### Admin — view results
| `src/app/api/admin/assessment-attempts/route.ts` | `GET` paginated (`subject`, `topic`, `status`, `q`=tutor anonymousId); summary rows |
| `src/app/api/admin/assessment-attempts/[attemptId]/route.ts` | `GET` full detail — ordered items, each with prompt, **all** options (`text` + `isCorrect`), `selectedOptionId`, `isCorrect`, `explanation` |

#### Tutor — take assessment (`role !== "STUDENT_TUTOR"` → 401)
| `src/app/api/tutor/assessments/route.ts` | `GET` the caller's own attempts (newest first, summary). `POST` `startAssessmentSchema`: resolve `tutorProfile` (404 if none); validate topic in catalog; if an `IN_PROGRESS` attempt exists → return it (resume, 200); if `TopicCertification` already `CERTIFIED` → 409; load merged config, count `active` questions — if `< minBankSize` → **409 `{ error, code: "BANK_NOT_READY" }`**; else txn: `attemptNo = max+1`, `pickQuestionIds`, create attempt + items; return questions **without** `isCorrect`/`explanation` |
| `src/app/api/tutor/assessments/[attemptId]/route.ts` | `GET` — ownership check (else 404); `IN_PROGRESS` → questions only; submitted → full graded review |
| `src/app/api/tutor/assessments/[attemptId]/submit/route.ts` | `POST` `submitAssessmentSchema`; attempt must be owned + `IN_PROGRESS` (else 409). Txn: per item set `selectedOptionId` (validate option belongs to that question) and `isCorrect`; compute `correctCount`, `scorePercent = round(correct/questionCount*100)`, `status = scorePercent >= passPercent ? PASSED : FAILED`, `submittedAt`. **On PASSED**: read `getSetting("autoCertifyOnAssessmentPass")`; upsert `TopicCertification` on `[tutorProfileId, subject, topic]` → `CERTIFIED` (auto on) **or** `PENDING` with `reviewNote: "Passed assessment (N%) — awaiting admin confirmation."` (auto off); never downgrade an existing `CERTIFIED`. **On FAILED**: if not already `CERTIFIED`, upsert → `REJECTED`, `reviewNote: "Did not pass assessment (N%). You may retake."`. No audit rows (tutor action; `AuditLog.adminId` is admin-only). Return graded review |
| `src/app/api/tutor/question-requests/route.ts` | `GET` caller's own requests. `POST` `requestQuestionsSchema`: validate topic; upsert on `[tutorProfileId, subject, topic]` — create `OPEN`, or reopen a `RESOLVED`/`DISMISSED` row to `OPEN` (clear resolved fields), or 200 no-op if already `OPEN` |

---

### UI — Admin

#### Nav — `src/app/admin/layout.tsx`
Add to the **Review** group: `{ label: "Question Bank", href: "/admin/question-bank", icon: <FileQuestion className="w-4 h-4" /> }` (lucide `FileQuestion`).

#### `src/app/admin/question-bank/page.tsx` (lean server component)
`<PageHeader eyebrow="Admin Portal" title="Assessment Question Bank" subtitle="…" />` + `<QuestionBankManager />`.

#### `src/components/admin/QuestionBankManager.tsx` (`"use client"`) — mirrors `CertificationReviewTable.tsx`
`Tabs`: **Questions** | **Requests (openCount)** | **Results**.

- **Questions** — Subject `<select>` (keys of `SUBJECT_TOPICS`) + Topic `<select>` (`SUBJECT_TOPICS[subject]`).
  Coverage banner for the selected topic ("12 active · needs ≥ 5 · Ready" / "3 / 5 — not assessable yet")
  from `/api/admin/assessment-questions/coverage`, with an inline per-topic config editor
  (`questionCount` / `passPercent` / `minBankSize` number inputs → `PATCH /api/admin/assessment-configs`).
  "Add question" → modal: prompt textarea, explanation textarea, 2–6 option rows (text input + "correct"
  radio) with add/remove. `usePaginatedList<Question>("/api/admin/assessment-questions", "questions",
  { subject, topic, …q }, 10, "…", "qbank")`. Table: prompt (truncated), option count, correct-answer
  preview, `active` toggle, **Edit** (disabled + tooltip when `inUse`), **Delete** (disabled when `inUse`).
- **Requests** — `usePaginatedList<QRequest>("/api/admin/question-requests", "requests", { status }, 10, "…", "qreq")`;
  sub-tabs Open / Resolved / Dismissed. Row: tutor `AnonymousIdBadge`, subject, topic, note, date;
  **Resolve** / **Dismiss** (`PATCH`, optional note). Resolve deep-links to the Questions tab pre-filtered.
- **Results** — `usePaginatedList<AttemptRow>("/api/admin/assessment-attempts", "attempts", { subject, topic, status, q }, 10, "…", "qres")`.
  Row: tutor badge, subject, topic, attempt #, score, `StatusBadge`, submitted date; **View** → modal
  (`GET /api/admin/assessment-attempts/[attemptId]`) listing every question, all options with the correct
  one marked, the tutor's pick, per-question ✓/✗, explanation.

#### `src/components/admin/PlatformSettingsForm.tsx`
Add a labelled row for `autoCertifyOnAssessmentPass` — "Auto-certify tutors who pass an assessment",
help text: "When off, a passing assessment creates a pending certification for admin confirmation."

#### `src/app/admin/page.tsx` (dashboard)
Add `prisma.questionRequest.count({ where: { status: "OPEN" } })` to the `Promise.all` and a
`{ label: "Open question requests", value, href: "/admin/question-bank" }` entry in `actions`.

---

### UI — Tutor

#### `src/app/tutor/assessments/page.tsx`
Also compute, per taught topic, `getTopicAssessmentStatus(tutorProfile.id, taughtTopics)` and pass the
resulting map into `AssessmentsTabs` → `TopicCertificationList` / `AssessmentHistory`.

#### `src/components/tutor/TopicCertificationList.tsx` — rework the per-row action
- `CERTIFIED` → "Verified" badge (unchanged).
- Passed, awaiting admin (auto-certify off, `TopicCertification` `PENDING` with score) → "Passed — awaiting confirmation" badge.
- `inProgressAttemptId` set → **Resume assessment** → `router.push('/tutor/assessments/' + id)`.
- Bank ready, not certified, none in progress → **Take assessment** → `POST /api/tutor/assessments` then push to the new attempt.
- Bank **not** ready → **Request questions** → `POST /api/tutor/question-requests`; then muted "Questions requested". If `openRequest` already true, show that state directly.
- `lastAttempt.status === "FAILED"` → "Not passed — N%" + **Retake** (same handler as Take).

#### `src/app/tutor/assessments/[attemptId]/page.tsx` (new server component)
Load attempt with ownership check (else `notFound()`); render `<AssessmentQuizRunner attempt={…} />`.

#### `src/components/tutor/AssessmentQuizRunner.tsx` (new, `"use client"`)
- `IN_PROGRESS`: question cards with radio option groups (served order), answered/total progress,
  **Submit** (`ConfirmDialog` if unanswered remain) → `POST …/submit` → switch to review.
- Review: pass/fail `FeedbackBanner`, score, each question card showing the tutor's answer, the correct
  answer highlighted, and the explanation. "Back to assessments" link.
- Same component renders a already-submitted attempt read-only (reached from history).

#### `src/components/tutor/AssessmentHistory.tsx` + `AssessmentsTabs.tsx`
Rename the tab "Request History" → **"Assessment History"**. Under each topic, list attempts
(attempt #, date, score, PASSED/FAILED `StatusBadge`, **Review** → `/tutor/assessments/{id}`) from
`GET /api/tutor/assessments`.

---

### Seed — `prisma/seed.ts`
Add ~10 single-answer questions (4 options / 1 correct each) across two topics seeded tutors teach —
e.g. MATH "Algebraic Expressions", ENGLISH "Grammar & Sentence Structure" — via
`prisma.assessmentQuestion.create({ data: { …, options: { create: [...] } } })`. Optionally one
`TopicAssessmentConfig` override and one `OPEN` `QuestionRequest` for demo data.

---

### Tests (Vitest, `__tests__/` beside each route; mock `@/lib/prisma` via `vi.hoisted`, `getServerSession`, and `@/lib/settings.getSetting` as in `src/app/api/classes/__tests__/route.test.ts`)
- `api/admin/assessment-questions/__tests__/route.test.ts` — 401 non-admin; 400 when not exactly one correct option; 400 invalid topic; 201 writes question+options+audit; GET pagination + `inUse`.
- `api/admin/assessment-questions/[questionId]/__tests__/route.test.ts` — PATCH rejects content edit when `inUse`; DELETE 409 when `inUse`.
- `api/admin/assessment-configs/__tests__/route.test.ts` — upsert, RBAC, range validation.
- `api/admin/question-requests/[requestId]/__tests__/route.test.ts` — resolve/dismiss, RBAC, audit row.
- `api/tutor/assessments/__tests__/route.test.ts` — 409 `BANK_NOT_READY`; creates attempt with N items when ready; resumes existing `IN_PROGRESS`; 409 when already `CERTIFIED`.
- `api/tutor/assessments/[attemptId]/submit/__tests__/route.test.ts` — grading math; PASSED + auto-certify on → `CERTIFIED`; PASSED + auto off → `PENDING`; FAILED → `REJECTED`; ownership 404; double-submit 409.
- `lib/__tests__/assessmentPicker.test.ts` — prefers unseen; falls back to reuse; returns exactly `count`.
- `lib/__tests__/assessmentConfig.test.ts` — merge row/null with defaults.

---

### Verification (end-to-end)
1. `npx prisma migrate dev --name assessment_question_bank` *(confirm first)*, `npx prisma generate`, `pnpm exec tsx prisma/seed.ts`.
2. `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`.
3. `pnpm dev`:
   - Admin → **Question Bank** → MATH / "Linear Equations & Inequalities" (empty) → add 5 questions → coverage flips to **Ready**; set that topic's `passPercent` to 60 and save.
   - Admin → **Settings** → enable "Auto-certify tutors who pass an assessment".
   - Log in as a seeded tutor teaching that topic → **Assessments** → **Take assessment** → answer → submit → score + per-question review; on pass the topic shows **Verified**.
   - Retake a topic whose bank ≥ 2× `questionCount` → confirm a different question set is served.
   - Disable auto-certify; fail then pass another topic → tutor sees "awaiting confirmation"; admin **Certifications** shows it `PENDING` with the score note → approve.
   - Tutor picks a topic with an empty bank → **Request questions** → admin **Question Bank → Requests** shows it → **Resolve**.
   - Admin **Question Bank → Results** → open the attempt → every asked question, the tutor's answer, and the correct answer are recorded.

---

### Files touched (summary)

**New — schema/lib:** `prisma/schema.prisma` (models), `src/lib/assessmentConfig.ts`,
`src/lib/assessmentPicker.ts`, `src/lib/assessmentStatus.ts`, `src/lib/validations/assessment.ts`.
**Edit — lib:** `src/lib/auditLog.ts`, `src/lib/settings.ts`, `src/lib/validations/admin.ts`, `prisma/seed.ts`.
**New — API:** `src/app/api/admin/assessment-questions/{route,[questionId]/route,coverage/route}.ts`,
`src/app/api/admin/assessment-configs/route.ts`,
`src/app/api/admin/question-requests/{route,[requestId]/route}.ts`,
`src/app/api/admin/assessment-attempts/{route,[attemptId]/route}.ts`,
`src/app/api/tutor/assessments/{route,[attemptId]/route,[attemptId]/submit/route}.ts`,
`src/app/api/tutor/question-requests/route.ts`.
**New — UI:** `src/app/admin/question-bank/page.tsx`, `src/components/admin/QuestionBankManager.tsx`,
`src/app/tutor/assessments/[attemptId]/page.tsx`, `src/components/tutor/AssessmentQuizRunner.tsx`.
**Edit — UI:** `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`,
`src/components/admin/PlatformSettingsForm.tsx`, `src/app/tutor/assessments/page.tsx`,
`src/components/tutor/{TopicCertificationList,AssessmentHistory,AssessmentsTabs}.tsx`.
**New — tests:** as listed above.


---

## Global assessment config (replace per-topic config)

**Status:** implemented 2026-09-03
**TODO source:** `docs/backlog/TODO.txt` — "Assessment settings should not be by topic
but one settings for all subject and topic and put it in the assessment option"
(and the cut-off "assessment configuration should be on the setting assessment
tab" line above it).

### Before

Each `(subject, topic)` pair could have a `TopicAssessmentConfig` row overriding
the three global defaults in `src/lib/assessmentConfig.ts`:

| field | default | meaning |
|---|---|---|
| `questionCount` | 5 | items served per attempt |
| `passPercent` | 80 | % correct to pass |
| `minBankSize` | 5 | active questions before a topic is assessable |

Admins edited these per topic in `CoveragePanel` inside `QuestionBankManager`
(the question drill-down), via `PATCH /api/admin/assessment-configs`.

### After

One platform-wide value for each of the three fields, applied to every subject
and topic. Edited on **Admin → Settings**, in a new "Assessment" section.
`CoveragePanel` becomes read-only and links to Settings.

### Storage — no migration

Reuse the existing key/value `PlatformSetting` table (`platform_settings`), the
same store the boolean flags use. Three new string-valued keys:

- `assessmentQuestionCount`
- `assessmentPassPercent`
- `assessmentMinBankSize`

Missing / unparseable / non-positive → fall back to `ASSESSMENT_DEFAULTS`.

`TopicAssessmentConfig` (model + `topic_assessment_configs` table + the
`User.updatedAssessmentConfigs` relation) is left in the schema **dormant** —
nothing reads or writes it after this change. Dropping it is a follow-up that
needs its own migration + DB-modification confirmation; tracked at the bottom of
this file.

### Changes

#### lib

- **`src/lib/assessmentConfig.ts`** — drop `resolveTopicConfig(row)` and the
  `import type { TopicAssessmentConfig }`. Keep `ASSESSMENT_DEFAULTS`,
  `OPTION_COUNT_MIN/MAX`, `ResolvedTopicConfig`.
- **`src/lib/settings.ts`** — add `ASSESSMENT_SETTING_KEYS` and
  `getAssessmentConfig(): Promise<ResolvedTopicConfig>` (one `findMany` over the
  three keys, parsed, defaulted).

#### consumers (all previously `resolveTopicConfig(row)` → now `getAssessmentConfig()`)

- **`src/lib/assessmentStatus.ts`** — drop `topicAssessmentConfig.findMany` from
  the `Promise.all`; resolve one `cfg` and use it for every topic.
- **`src/app/api/admin/assessment-questions/coverage/route.ts`** — same; every
  coverage row now carries the same global `config`; `hasOverride` field removed.
- **`src/app/api/tutor/assessments/route.ts`** — drop the `topicAssessmentConfig`
  lookup at quiz start; use `getAssessmentConfig()`.

#### API

- **`src/app/api/admin/assessment-configs/route.ts`** — repurposed from per-topic
  to global. `GET` → `{ questionCount, passPercent, minBankSize }`. `PATCH` →
  body `{ questionCount?, passPercent?, minBankSize? }` (≥1 field), upserts the
  `PlatformSetting` rows, ADMIN-only. URL kept so nothing else needs repointing.
- **`src/lib/validations/assessment.ts`** — `updateTopicAssessmentConfigSchema`
  → `updateGlobalAssessmentConfigSchema` (no `subject`/`topic`; the three ints
  optional; `.refine` at least one present).

#### UI

- **`src/components/admin/PlatformSettingsForm.tsx`** — settings split into
  "General" and "Assessment" groups. The Assessment group holds the
  `autoCertifyOnAssessmentPass` toggle plus three number inputs (Questions per
  attempt / Pass % / Minimum bank size), saved on blur via the repurposed
  `/api/admin/assessment-configs` `PATCH`.
- **`src/components/admin/QuestionBankManager.tsx`** — `CoverageRow` loses
  `hasOverride`; `CoveragePanel` is now a read-only readiness strip with a
  "Settings → Assessment" link, no inputs / save.
- **`src/app/admin/settings/page.tsx`** — subtitle mentions assessment tuning.

#### seed

- **`prisma/seed.ts`** — the `topicAssessmentConfig.upsert` is replaced by a
  `platformSetting` upsert that sets `assessmentPassPercent = 60` (so the admin
  UI shows a non-default value).

#### tests

- `src/lib/__tests__/assessmentConfig.test.ts` — rewritten for
  `getAssessmentConfig()` (prisma mocked).
- `src/app/api/admin/assessment-configs/__tests__/route.test.ts` — rewritten for
  the global GET/PATCH.
- `src/app/api/tutor/assessments/__tests__/route.test.ts` — mock updated
  (`platformSetting.findMany` instead of `topicAssessmentConfig.findUnique`).

### Follow-up — done 2026-09-03

`model TopicAssessmentConfig`, the `topic_assessment_configs` table and the
`User.updatedAssessmentConfigs` relation were removed. Applied to the dev DB with
`prisma db push --accept-data-loss` (dropped the table + its 2 seed rows) rather
than `migrate dev`, because the local migration history is already drifted
(`20260902081727_class_pre_post_tests` is applied but only on an unmerged branch)
and `migrate dev` would have forced a full-database reset. No new migration file.


---

## Per-Session Pre/Post-Test Assessment

### Context

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

#### Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Branch | **Adapt it**, don't rebuild — the API/lib/test layers largely survive |
| Question set | **One set per session, served twice** (as PRE, then as POST) |
| Learner progress | **Both** the class detail page **and** a new "My Progress" page |
| Charts | **All four** — pre-vs-post per session, learner over time, per-question rate, per-learner delta |

#### Two structural corrections beyond re-graining

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

### 1. Schema *(needs explicit DB confirmation per CLAUDE.md)*

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

#### Migration — history is drifted

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

#### Feature flag

`sessionTestsEnabled` in `PLATFORM_SETTING_KEYS` + `DEFAULTS` (`src/lib/settings.ts`) — two lines,
no migration. Toggle in `PlatformSettingsForm` "General". When off: create/publish 403s, learner
surfaces hide, collected data stays readable.

---

### 2. Gating — kind ⇄ session status

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

### 3. Routes

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

### 4. Analytics — 4 charts, 3 routes

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

#### Double-blind (RA 10173)

- **Learners → tutor/admin:** return `anonymousId` + opaque `attemptId` only. `learner.id` is a
  server-side Map key and is stripped. *This is a fix* — the branch's `buildClassTestResults`
  returned `l.id`.
- **Tutor → learner:** progress payloads carry `classCode`, `subject`, `topic`, `scheduledAt` —
  **no tutor identity**. Don't add a `tutorName` field.
- **No cohort stats on the learner side.** In a 1-on-1 or 3-learner class, "class average" is a
  de-anonymisation oracle. Learners see only their own series.
- Verification greps for `firstName|lastName` in the new files.

---

### 5. ⚠️ Question-origin isolation (correctness-critical)

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

### 6. UI

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

### 7. Branch disposition

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

### 8. Tests

New: `sessionTestResults`, `sessionTestSerialize`, `sessionTestAccess`, `gradeAttempt` (lib);
tutor test CRUD / questions / status / results / roll-up; learner start (**one case per row of
the §2 ladder**), session-tests list, submit, progress; admin list.

Updated: `assessmentPicker` (+`origin: "BANK"` assertion), `admin/assessment-questions` ×2,
sessions `[sessionId]` (post-test notification), and **`tutor/assessments` — a new case asserting
the `activeCount` query filters `origin: "BANK"`**, guarding §5.

Assert throughout: `reveal:false` → `.not.toHaveProperty(...)`; results rows have **no** `id`;
`avgDelta ≠ avgPost − avgPre` when unpaired learners exist. Target ~478 → **560+**.

---

### 9. Phases

Each boundary leaves `tsc` + `lint` + `test` green.

0. **Charts extraction** — no feature code, no schema. Ships value standalone.
1. **Schema + generate** *(DB confirmation gate)*.
2. **Origin isolation** — the 6 filters, tutor question CRUD, `QuestionFormModal`, bank re-extraction.
3. **Backend: libs + tutor routes.**
4. **Backend: learner + admin routes**, notification hook, feature flag.
5. **Tutor UI** — builder, results + charts (a)(c)(d), class panel.
6. **Learner + admin UI** — runner, My Progress + chart (b), admin table, settings toggle.
7. **Seed + docs.**

### 10. Verification

```bash
npx prisma generate && pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
pnpm exec tsx prisma/seed.ts                      # DB confirmation
grep -rn "firstName\|lastName" src/lib/sessionTestResults.ts src/app/api/learner/progress   # must be empty
grep -rn "assessmentQuestion\." src --include=*.ts | grep -v __tests__   # each hit needs an origin filter or a comment
```

Manual smoke (each becomes a `docs/backlog/TOTEST.txt` `[ ]`): build + publish a test → learners notified
→ learner takes pre-test → post-test blocked while SCHEDULED → tutor marks COMPLETED → learners
notified, pre-test entry gone, post-test appears → learner submits, sees score **and** delta →
re-open shows review only → tutor results show all three charts, never-taken learners as dashes →
class roll-up shows a session without a test as a gap not a zero → My Progress shows the series
with **no tutor name and no class average** → question set locked after publish → CANCELLED
session blocks new attempts → admin list + `sessionTestsEnabled` toggle → **regressions:**
certification quiz still serves bank-only and still fires `BANK_NOT_READY` on a thin topic even
with 20 tutor-authored questions; question-bank modal and `/admin/reports` unchanged.

### 11. Docs

`docs/plans/session-pre-post-tests.md` (this plan) + `plans/README.md` row; `Changes.md` Part;
`docs/backlog/TOTEST.txt`; `docs/reference/feature-checklist.md` §4 rows 78–79 ⚠️→✅, line 127, and drop the
"decide whether to merge the branch" gap on line 131; **`docs/reference/decisions.md` — two new
entries**: (1) pre/post are scoped **per session, not per class** (the branch model is superseded,
do not revive), (2) **one question set served twice**, with the implication that the randomising
`pickQuestionIds()` must never be wired into session tests. Role docs for all three roles.
`docs/reference/erd.md` regenerates on `prisma generate`.

**No commits, no pushes, no `db push`/`migrate` without explicit confirmation.**

### Risks

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

