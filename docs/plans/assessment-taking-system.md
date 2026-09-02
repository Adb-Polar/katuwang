# Assessment-Taking System (Question Bank + Auto-Graded Topic Quizzes)

> On approval, copy this file to `docs/plans/assessment-taking-system.md` (CLAUDE.md convention).
> No commits/pushes. The Prisma migration is a DB modification and needs explicit confirmation before running.

## Context

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

### Decisions locked with the user

| Topic | Decision |
|---|---|
| Pass outcome | New **platform setting** `autoCertifyOnAssessmentPass` (default **off**). ON → a passing quiz sets `TopicCertification` to `CERTIFIED` automatically. OFF → a passing quiz creates a `PENDING` certification carrying the score, and the admin confirms it on the existing Certifications screen. |
| Question format | **Single-answer multiple choice only** (2–6 options, exactly one correct). Other types out of scope. |
| Retake variety | **Best-effort**: picker prefers questions absent from the tutor's last attempt for that topic; reuses when the pool is too small. |
| Quiz config | **Per-topic, admin-configurable**: `questionCount`, `passPercent`, `minBankSize` per `subject+topic`, falling back to global defaults when unset. |

---

## Data model (Prisma) — all additive

New file changes in `prisma/schema.prisma`. No existing columns change; only new models + new back-relations
on `User` and `TutorProfile`, and two new enums.

```prisma
enum AssessmentAttemptStatus { IN_PROGRESS PASSED FAILED }
enum QuestionRequestStatus   { OPEN RESOLVED DISMISSED }
```

### `AssessmentQuestion` — the bank
- `id`, `subject SubjectArea`, `topic String`, `prompt @db.Text`, `explanation String? @db.Text`
- `active Boolean @default(true)` — soft-retire; rows referenced by an attempt are never hard-deleted
- `createdById` → `User` (`@relation("AuthoredQuestions")`), `createdAt`, `updatedAt`
- children: `options AssessmentOption[]`, `attemptItems AssessmentAttemptItem[]`
- `@@index([subject, topic, active])`, `@@map("assessment_questions")`

### `AssessmentOption` — choices (3NF child, not a JSON blob)
- `id`, `questionId` → `AssessmentQuestion` (`onDelete: Cascade`)
- `text @db.Text`, `isCorrect Boolean @default(false)`, `position Int`
- `@@unique([questionId, position])`, `@@map("assessment_options")`

**Immutability rule (keeps attempts accurate without snapshot columns):** once a question has any
`AssessmentAttemptItem`, admins may only toggle `active` — prompt/options/correctness become read-only.
Editing is unrestricted before first use. Enforced in the PATCH route and reflected in the UI
(disabled "Edit" with a tooltip: "In use — retire and recreate to change").

### `TopicAssessmentConfig` — per-topic tuning
- `id`, `subject SubjectArea`, `topic String`
- `questionCount Int @default(5)`, `passPercent Int @default(80)`, `minBankSize Int @default(5)`
- `updatedById String?` → `User` (`@relation("UpdatedAssessmentConfigs")`), `updatedAt`
- `@@unique([subject, topic])`, `@@map("topic_assessment_configs")`
- Missing row ⇒ global defaults from `src/lib/assessmentConfig.ts`.

### `AssessmentAttempt` — saved result
- `id`, `tutorProfileId` → `TutorProfile` (`onDelete: Cascade`), `subject`, `topic`
- `attemptNo Int`, `status AssessmentAttemptStatus @default(IN_PROGRESS)`
- `questionCount Int`, `correctCount Int @default(0)`, `scorePercent Int @default(0)`, `passPercent Int` (snapshot at start)
- `startedAt`, `submittedAt DateTime?`
- children: `items AssessmentAttemptItem[]`
- `@@unique([tutorProfileId, subject, topic, attemptNo])`, `@@index([tutorProfileId, subject, topic])`, `@@index([status])`, `@@map("assessment_attempts")`

### `AssessmentAttemptItem` — questions asked + tutor's answer
- `id`, `attemptId` → `AssessmentAttempt` (`onDelete: Cascade`)
- `questionId` → `AssessmentQuestion` (restrict delete), `position Int`
- `selectedOptionId String?` → `AssessmentOption` (`@relation("SelectedOption")`), `isCorrect Boolean?` (graded on submit)
- `@@unique([attemptId, position])`, `@@unique([attemptId, questionId])`, `@@map("assessment_attempt_items")`

### `QuestionRequest` — tutor asks admin to add questions
- `id`, `tutorProfileId` → `TutorProfile` (`onDelete: Cascade`), `subject`, `topic`, `note String? @db.Text`
- `status QuestionRequestStatus @default(OPEN)`
- `resolvedById String?` → `User` (`@relation("ResolvedQuestionRequests")`), `resolvedAt DateTime?`, `resolutionNote String? @db.Text`
- `createdAt`, `updatedAt`
- `@@unique([tutorProfileId, subject, topic])` (re-requesting reopens the same row), `@@index([status, subject])`, `@@map("question_requests")`

### Migration
`npx prisma migrate dev --name assessment_question_bank` then `npx prisma generate`.
**Ask the user before running** (DB modification per CLAUDE.md).

---

## Shared library code (new)

### `src/lib/assessmentConfig.ts`
```ts
export const ASSESSMENT_DEFAULTS = { questionCount: 5, passPercent: 80, minBankSize: 5 };
export const OPTION_COUNT_MIN = 2;
export const OPTION_COUNT_MAX = 6;
export function resolveTopicConfig(row: TopicAssessmentConfig | null): typeof ASSESSMENT_DEFAULTS;
```

### `src/lib/assessmentPicker.ts`
`pickQuestionIds(tx, { tutorProfileId, subject, topic, count }): Promise<string[]>`
1. `pool` = `active` question ids for `(subject, topic)`.
2. `seen` = question ids from the tutor's most recent submitted attempt for `(subject, topic)`.
3. `fresh = pool − seen`, `repeat = pool ∩ seen`; Fisher–Yates shuffle both.
4. Take from `fresh` first, top up from `repeat`, slice to `count`, shuffle the final list.
Guards: if `pool.length < count`, return what's available (caller already blocked via `minBankSize`).

### `src/lib/assessmentStatus.ts`
`getTopicAssessmentStatus(tutorProfileId, taughtTopics): Map<"SUBJECT::topic", TopicAssessmentStatus>`
where `TopicAssessmentStatus = { bankReady, inProgressAttemptId, lastAttempt: { id, status, scorePercent } | null, openRequest: boolean, certificationStatus }`.
Used by the tutor Assessments page to drive per-row buttons in one query pass.

### `src/lib/validations/assessment.ts` (new; mirrors style of `src/lib/validations/admin.ts`)
- `optionInputSchema` — `{ text: string trim 1..500, isCorrect: boolean }`
- `createAssessmentQuestionSchema` — `{ subject: nativeEnum(SubjectArea), topic: string min 1, prompt: string 5..1000, explanation?: string max 1000, options: optionInputSchema[].min(2).max(6) }` + `.refine` exactly one `isCorrect` → "Mark exactly one option correct."
- `updateAssessmentQuestionSchema` — `createAssessmentQuestionSchema.partial().extend({ active: boolean().optional() })`
- `updateTopicAssessmentConfigSchema` — `{ subject, topic: string min 1, questionCount?: int 1..50, passPercent?: int 1..100, minBankSize?: int 1..200 }`
- `startAssessmentSchema` — `{ subject: nativeEnum, topic: string min 1 }`
- `submitAssessmentSchema` — `{ answers: { questionId: string min 1, optionId: string min 1 }[].min(1).max(50) }`
- `requestQuestionsSchema` — `{ subject: nativeEnum, topic: string min 1, note?: string max 500 }`
- `resolveQuestionRequestSchema` — `{ status: enum(["RESOLVED","DISMISSED"]), resolutionNote?: string max 500 }`
- each with `export type …Input = z.infer<…>`

### `src/lib/auditLog.ts` — add constants
`AUDIT_ACTIONS`: `QUESTION_CREATED`, `QUESTION_UPDATED`, `QUESTION_RETIRED`, `QUESTION_DELETED`,
`ASSESSMENT_CONFIG_UPDATED`, `QUESTION_REQUEST_RESOLVED`.
`AUDIT_TARGET_TYPES`: `QUESTION`, `QUESTION_REQUEST`, `ASSESSMENT_CONFIG`.

### `src/lib/settings.ts` + `src/lib/validations/admin.ts`
Add `"autoCertifyOnAssessmentPass"` to `PLATFORM_SETTING_KEYS`, to `DEFAULTS` (`false`), and to the
`updatePlatformSettingSchema` key enum.

---

## API routes (new) — follow the pattern in `src/app/api/admin/registrations/route.ts`

Every route: `getServerSession(authOptions)` guard returning **401** `{ error: "Unauthorized." }`,
Zod `safeParse` → **400** with `issues[0].message`, `try/catch` → `console.error` + **500**
`{ error: "An unexpected error occurred." }`, multi-write in `prisma.$transaction`, list responses shaped
`{ <key>, total, page, pageSize }`. Peer-facing tutor data selects **only `id` + `anonymousId`** (RA 10173).

### Admin — question bank
| Route | Methods |
|---|---|
| `src/app/api/admin/assessment-questions/route.ts` | `GET` paginated (`subject`, `topic`, `active`, `q`, `page`, `pageSize`; each row includes ordered `options` + `inUse`); `POST` create (validate `topic ∈ SUBJECT_TOPICS[subject]`, create question+options in txn, audit `QUESTION_CREATED`) |
| `src/app/api/admin/assessment-questions/[questionId]/route.ts` | `GET` one; `PATCH` (if `inUse` → accept only `{ active }`, audit `QUESTION_RETIRED`; else full edit replacing options in txn, audit `QUESTION_UPDATED`); `DELETE` (409 if `inUse`, else cascade-delete, audit `QUESTION_DELETED`) |
| `src/app/api/admin/assessment-questions/coverage/route.ts` | `GET` — for every `(subject, topic)` in `SUBJECT_TOPICS`: `{ subject, topic, activeCount, config, ready: activeCount >= config.minBankSize, openRequests }` |

### Admin — per-topic config
| `src/app/api/admin/assessment-configs/route.ts` | `PATCH` — `updateTopicAssessmentConfigSchema`, upsert on `[subject, topic]`, audit `ASSESSMENT_CONFIG_UPDATED` |

### Admin — question requests
| `src/app/api/admin/question-requests/route.ts` | `GET` paginated (`status` default `OPEN`, `subject`, `q`); tutor shown as `{ id, anonymousId }` |
| `src/app/api/admin/question-requests/[requestId]/route.ts` | `PATCH` — `resolveQuestionRequestSchema`, set `resolvedById`/`resolvedAt`, audit `QUESTION_REQUEST_RESOLVED` |

### Admin — view results
| `src/app/api/admin/assessment-attempts/route.ts` | `GET` paginated (`subject`, `topic`, `status`, `q`=tutor anonymousId); summary rows |
| `src/app/api/admin/assessment-attempts/[attemptId]/route.ts` | `GET` full detail — ordered items, each with prompt, **all** options (`text` + `isCorrect`), `selectedOptionId`, `isCorrect`, `explanation` |

### Tutor — take assessment (`role !== "STUDENT_TUTOR"` → 401)
| `src/app/api/tutor/assessments/route.ts` | `GET` the caller's own attempts (newest first, summary). `POST` `startAssessmentSchema`: resolve `tutorProfile` (404 if none); validate topic in catalog; if an `IN_PROGRESS` attempt exists → return it (resume, 200); if `TopicCertification` already `CERTIFIED` → 409; load merged config, count `active` questions — if `< minBankSize` → **409 `{ error, code: "BANK_NOT_READY" }`**; else txn: `attemptNo = max+1`, `pickQuestionIds`, create attempt + items; return questions **without** `isCorrect`/`explanation` |
| `src/app/api/tutor/assessments/[attemptId]/route.ts` | `GET` — ownership check (else 404); `IN_PROGRESS` → questions only; submitted → full graded review |
| `src/app/api/tutor/assessments/[attemptId]/submit/route.ts` | `POST` `submitAssessmentSchema`; attempt must be owned + `IN_PROGRESS` (else 409). Txn: per item set `selectedOptionId` (validate option belongs to that question) and `isCorrect`; compute `correctCount`, `scorePercent = round(correct/questionCount*100)`, `status = scorePercent >= passPercent ? PASSED : FAILED`, `submittedAt`. **On PASSED**: read `getSetting("autoCertifyOnAssessmentPass")`; upsert `TopicCertification` on `[tutorProfileId, subject, topic]` → `CERTIFIED` (auto on) **or** `PENDING` with `reviewNote: "Passed assessment (N%) — awaiting admin confirmation."` (auto off); never downgrade an existing `CERTIFIED`. **On FAILED**: if not already `CERTIFIED`, upsert → `REJECTED`, `reviewNote: "Did not pass assessment (N%). You may retake."`. No audit rows (tutor action; `AuditLog.adminId` is admin-only). Return graded review |
| `src/app/api/tutor/question-requests/route.ts` | `GET` caller's own requests. `POST` `requestQuestionsSchema`: validate topic; upsert on `[tutorProfileId, subject, topic]` — create `OPEN`, or reopen a `RESOLVED`/`DISMISSED` row to `OPEN` (clear resolved fields), or 200 no-op if already `OPEN` |

---

## UI — Admin

### Nav — `src/app/admin/layout.tsx`
Add to the **Review** group: `{ label: "Question Bank", href: "/admin/question-bank", icon: <FileQuestion className="w-4 h-4" /> }` (lucide `FileQuestion`).

### `src/app/admin/question-bank/page.tsx` (lean server component)
`<PageHeader eyebrow="Admin Portal" title="Assessment Question Bank" subtitle="…" />` + `<QuestionBankManager />`.

### `src/components/admin/QuestionBankManager.tsx` (`"use client"`) — mirrors `CertificationReviewTable.tsx`
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

### `src/components/admin/PlatformSettingsForm.tsx`
Add a labelled row for `autoCertifyOnAssessmentPass` — "Auto-certify tutors who pass an assessment",
help text: "When off, a passing assessment creates a pending certification for admin confirmation."

### `src/app/admin/page.tsx` (dashboard)
Add `prisma.questionRequest.count({ where: { status: "OPEN" } })` to the `Promise.all` and a
`{ label: "Open question requests", value, href: "/admin/question-bank" }` entry in `actions`.

---

## UI — Tutor

### `src/app/tutor/assessments/page.tsx`
Also compute, per taught topic, `getTopicAssessmentStatus(tutorProfile.id, taughtTopics)` and pass the
resulting map into `AssessmentsTabs` → `TopicCertificationList` / `AssessmentHistory`.

### `src/components/tutor/TopicCertificationList.tsx` — rework the per-row action
- `CERTIFIED` → "Verified" badge (unchanged).
- Passed, awaiting admin (auto-certify off, `TopicCertification` `PENDING` with score) → "Passed — awaiting confirmation" badge.
- `inProgressAttemptId` set → **Resume assessment** → `router.push('/tutor/assessments/' + id)`.
- Bank ready, not certified, none in progress → **Take assessment** → `POST /api/tutor/assessments` then push to the new attempt.
- Bank **not** ready → **Request questions** → `POST /api/tutor/question-requests`; then muted "Questions requested". If `openRequest` already true, show that state directly.
- `lastAttempt.status === "FAILED"` → "Not passed — N%" + **Retake** (same handler as Take).

### `src/app/tutor/assessments/[attemptId]/page.tsx` (new server component)
Load attempt with ownership check (else `notFound()`); render `<AssessmentQuizRunner attempt={…} />`.

### `src/components/tutor/AssessmentQuizRunner.tsx` (new, `"use client"`)
- `IN_PROGRESS`: question cards with radio option groups (served order), answered/total progress,
  **Submit** (`ConfirmDialog` if unanswered remain) → `POST …/submit` → switch to review.
- Review: pass/fail `FeedbackBanner`, score, each question card showing the tutor's answer, the correct
  answer highlighted, and the explanation. "Back to assessments" link.
- Same component renders a already-submitted attempt read-only (reached from history).

### `src/components/tutor/AssessmentHistory.tsx` + `AssessmentsTabs.tsx`
Rename the tab "Request History" → **"Assessment History"**. Under each topic, list attempts
(attempt #, date, score, PASSED/FAILED `StatusBadge`, **Review** → `/tutor/assessments/{id}`) from
`GET /api/tutor/assessments`.

---

## Seed — `prisma/seed.ts`
Add ~10 single-answer questions (4 options / 1 correct each) across two topics seeded tutors teach —
e.g. MATH "Algebraic Expressions", ENGLISH "Grammar & Sentence Structure" — via
`prisma.assessmentQuestion.create({ data: { …, options: { create: [...] } } })`. Optionally one
`TopicAssessmentConfig` override and one `OPEN` `QuestionRequest` for demo data.

---

## Tests (Vitest, `__tests__/` beside each route; mock `@/lib/prisma` via `vi.hoisted`, `getServerSession`, and `@/lib/settings.getSetting` as in `src/app/api/classes/__tests__/route.test.ts`)
- `api/admin/assessment-questions/__tests__/route.test.ts` — 401 non-admin; 400 when not exactly one correct option; 400 invalid topic; 201 writes question+options+audit; GET pagination + `inUse`.
- `api/admin/assessment-questions/[questionId]/__tests__/route.test.ts` — PATCH rejects content edit when `inUse`; DELETE 409 when `inUse`.
- `api/admin/assessment-configs/__tests__/route.test.ts` — upsert, RBAC, range validation.
- `api/admin/question-requests/[requestId]/__tests__/route.test.ts` — resolve/dismiss, RBAC, audit row.
- `api/tutor/assessments/__tests__/route.test.ts` — 409 `BANK_NOT_READY`; creates attempt with N items when ready; resumes existing `IN_PROGRESS`; 409 when already `CERTIFIED`.
- `api/tutor/assessments/[attemptId]/submit/__tests__/route.test.ts` — grading math; PASSED + auto-certify on → `CERTIFIED`; PASSED + auto off → `PENDING`; FAILED → `REJECTED`; ownership 404; double-submit 409.
- `lib/__tests__/assessmentPicker.test.ts` — prefers unseen; falls back to reuse; returns exactly `count`.
- `lib/__tests__/assessmentConfig.test.ts` — merge row/null with defaults.

---

## Verification (end-to-end)
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

## Files touched (summary)

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
