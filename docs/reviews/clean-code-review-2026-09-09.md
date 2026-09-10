# Clean-Code Review — Katuwang `src/`

**Date:** 2026-09-09
**Standard:** Robert C. Martin, *Clean Code* Ch. 17 (TypeScript adaptation — see `.claude/skills/typescript-clean-code`)
**Scope:** `src/**` (396 `.ts`/`.tsx` files, ~43k LOC). Review is static reading + pattern search, not a full line-by-line audit.

---

## TL;DR

The codebase is **in good shape**. No `any` at boundaries, no `@ts-ignore`, no `eslint-disable`, no commented-out code, no stray `console.log`, no dead-obvious duplication of business rules. Scoring/matching logic is well-factored with named weight constants and TSDoc.

Findings are almost all **low-severity polish**: scattered constants that should be shared, a few oversized client components, and repeated date-math and date-formatting that wants a helper. Nothing here blocks a commit; treat this as a cleanup backlog.

| Severity | Count | Nature |
|---|---|---|
| 🔴 High | 0 | — |
| 🟠 Medium | 3 | Oversized components (G30/G34), duplicated scoring ladder (G5), duplicated role→href logic (G5) |
| 🟡 Low | 6 | Magic date arithmetic (G25), scattered `PAGE_SIZE` (G25/G5), inline `toLocaleString` vs helper (G5), repeated `Object.keys(...) as string[]` (TS3), local `formatDate` copies (G5), `SESSION_MS` naming spread |
| ✅ Good | — | See "What's already clean" |

---

## 🟠 Medium

### M1 — Two oversized "god" client components (G30, G34, G5)

| File | LOC | `useState` calls |
|---|---|---|
| `src/components/admin/QuestionBankManager.tsx` | 1037 | 19 |
| `src/components/tutor/SessionTestBuilder.tsx` | 735 | 29 |
| `src/components/admin/SubjectTopicManager.tsx` | 526 | 17 |

**Rule:** G30 (functions/components do one thing), G34 (one abstraction level), F1 (a component juggling 20–29 pieces of local state is past the argument/So-C budget).

**Why it matters:** `SessionTestBuilder` with 29 `useState` hooks mixes form state, modal state, async submit state, question-picker state and validation in one function body. Every edit touches an 700-line file and risks unrelated regressions; the render tree can't be reasoned about locally.

**Fix (incremental, no behaviour change):**
- Extract cohesive state groups into custom hooks: `useSessionTestForm()`, `useQuestionPicker()`, `useSubmitState()`.
- Split sub-views into child components (`<QuestionList>`, `<AddQuestionModal>`, `<TestHeaderForm>`).
- `QuestionBankManager` already has an internal `// ─── Types ───` section — that's a signal it should be 3–4 files (`questionBank.types.ts`, `<CoverageTab>`, `<RequestsTab>`, `<AttemptsTab>`).

Target: no client component over ~300 LOC / ~10 `useState`.

---

### M2 — The grade-match scoring ladder is duplicated (G5, G25)

**Locations:**
- `src/lib/matching.ts:8-9,144-152` — `WEIGHTS.gradeExact/gradeAdjacent/gradeAny` + the `exact ? … : adjacent ? … : any ? … : 0` ternary.
- `src/lib/browseRanking.ts:16-18,52-60` — the **same** three weights (identical values `6 / 3 / 2`) and the **same** ternary shape.

**Why it matters:** Two files encode the same rule ("exact grade beats adjacent beats open beats none") with copy-pasted weights. If the product decides adjacent-grade should score 4, someone will change one and miss the other — a silent ranking bug.

**Fix:** Add to `src/lib/matching.ts`:
```ts
export const GRADE_WEIGHTS = { exact: 6, adjacent: 3, any: 2, none: 0 } as const;
export function gradeScore(match: GradeMatch): number {
  return GRADE_WEIGHTS[match];
}
```
Then both `scoreClass` and `scoreBrowseClass` call `gradeScore(gradeMatchFor(...))`. `browseRanking.ts` already imports `gradeMatchFor` from `matching.ts`, so the dependency direction is fine.

---

### M3 — Role → portal-path mapping is re-implemented per call site (G5, G23, G28)

**Locations:**
- `src/app/api/search/route.ts:99-104` — `role === "STUDENT_LEARNER" ? "/learner/classes?q=…" : role === "STUDENT_TUTOR" ? "/tutor/classes?q=…" : "/admin/classes?q=…"`.
- Same three-way `role` ternary repeats for the class/tutor/topic result groups within that one file, and the `intents.ts` links (`src/lib/chatbot/intents.ts:99,110-115,129-134,162-166`) hand-roll `role === LEARNER ? "/learner/…" : … : "/admin/…"` over and over.

**Why it matters:** The portal prefix (`/learner` | `/tutor` | `/admin`) is a first-class concept with no single source of truth. Adding a role or renaming a portal segment is a shotgun edit.

**Fix:** One helper:
```ts
// src/lib/portalPaths.ts
const PREFIX: Record<Role, string> = {
  STUDENT_LEARNER: "/learner",
  STUDENT_TUTOR: "/tutor",
  ADMIN: "/admin",
};
export const portalPath = (role: Role, sub: string) => `${PREFIX[role]}${sub}`;
```
`portalPath(role, "/classes?q=" + encodeURIComponent(t.name))`. Removes ~4 ternaries in `search/route.ts` alone.

---

## 🟡 Low

### L1 — Magic millisecond arithmetic for "a day" / "a week" (G25, G33)

`24 * 60 * 60 * 1000` and friends appear hand-written in 8+ places with slightly different orderings:

| File:line | Expression |
|---|---|
| `src/lib/moderation.ts:5` | `durationDays * 24 * 60 * 60 * 1000` |
| `src/lib/browseRanking.ts:68` | `(nextMs - now) / (1000 * 60 * 60 * 24)` |
| `src/lib/matching.ts:154` | `(…getTime() - now) / (1000 * 60 * 60 * 24)` |
| `src/app/learner/page.tsx:19` | `now.getTime() + 7 * 24 * 60 * 60 * 1000` |
| `src/app/learner/tutors/[tutorId]/page.tsx:110` | same `7 * 24 * 60 * 60 * 1000` |
| `src/app/tutor/page.tsx:88` | same `7 * 24 * 60 * 60 * 1000` |
| `src/lib/passwordReset.ts:10` | `30 * 60 * 1000` (has a `// 30 minutes` comment — the good pattern) |
| `src/lib/classSessions.ts:25,34,37` | `s.duration * 60_000` (uses `60_000` — inconsistent with `60 * 1000` elsewhere) |

**Fix:** `src/lib/datetime.ts` (already exists) gains:
```ts
export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;
export const daysBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY_MS;
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
```
`const weekAhead = addDays(now, 7);` reads its own intent. Also standardise on `MINUTE_MS` vs the `60_000` / `60 * 1000` split.

---

### L2 — `PAGE_SIZE` / `DEFAULT_PAGE_SIZE` redeclared ~30 times (G25, G5, G11)

`DEFAULT_PAGE_SIZE = 10` is declared independently in ~20 API routes; `PAGE_SIZE = 10` in ~10 admin table components (`RegistrationApprovalTable`, `ClassModerationTable`, `UserManagementTable`, `QuestionBankManager`, …). Values also disagree: `10`, `12`, `25`, `8`, and bare `take: 5` / `take: 8` / `take: 100` literals in page components (`src/app/learner/page.tsx:31`, `src/app/admin/page.tsx:45`, `src/app/api/dev/route.ts:89`).

**Why it matters:** Not a bug, but "the admin list page size" has no canonical definition, and the client `PAGE_SIZE` must be kept in lockstep with the server `DEFAULT_PAGE_SIZE` by hand.

**Fix:** `src/lib/pagination.ts` exporting `ADMIN_PAGE_SIZE = 10`, `BROWSE_PAGE_SIZE = 12`, `AUDIT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 50`. Import on both sides. Replace bare `take: 5` literals with a named `DASHBOARD_PREVIEW_COUNT`.

---

### L3 — Inline `toLocaleDateString`/`toLocaleString` instead of the shared helper (G5, G6)

`src/lib/datetime.ts` exports `formatDateTime(iso)` — but 33 call sites across 24 files call `date.toLocaleDateString(...)` / `.toLocaleString(...)` directly with their own option objects (e.g. `src/components/admin/AuditLogTable.tsx`, `ClassAppealTable.tsx`, `QuestionBankManager.tsx`, `src/components/classes/ClassCard.tsx`, `SessionsList.tsx`, `src/app/admin/page.tsx`).

**Why it matters:** Date presentation drifts — some show `"Aug 30, 2026"`, some `"August 30, 2026 at 3:00 PM"`, some `"8/30/2026"`. A locale/format policy change can't be made in one place.

**Fix:** Grow `datetime.ts` into the single formatting module: `formatDate`, `formatDateTime`, `formatTime`, `formatRelative`. Codemod the 33 call sites. Delete the local one-off helpers in L4.

---

### L4 — Copy-pasted local `formatDate` helpers (G5, F4-adjacent)

- `src/app/tutor/students/[studentId]/page.tsx:14` — `function formatDate(d: Date)`
- `src/components/tutor/AssessmentHistory.tsx:29` — `function formatDate(dateStr: string)`
- `src/components/admin/ChatbotMissesTable.tsx:28` — `const formatWhen = (iso: string) => …`

Three private near-identical date formatters. Fold into L3's `datetime.ts` and delete.

---

### L5 — `Object.keys(SUBJECT_TOPICS) as string[]` repeated 7× (TS3, G5)

**Locations:** `src/lib/subjects.ts:36`, `src/lib/chatbot/recommend.ts:21`, `src/app/api/dev/route.ts:32`, `src/app/api/admin/assessment-questions/coverage/route.ts:39`, `src/hooks/useSubjectCatalog.ts:14`, `src/components/admin/QuestionBankManager.tsx:19`, plus `Object.values(Role) as string[]` in `src/app/api/admin/chatbot-misses/route.ts:26`.

**Why it matters:** The `as string[]` cast is a smell — it papers over `SUBJECT_TOPICS`'s key type. Each copy is a place the cast could go wrong if the source type changes.

**Fix:** Export the derived list once from where the data lives:
```ts
// src/lib/subjectTopics.ts
export const SUBJECT_SLUGS = Object.keys(SUBJECT_TOPICS) as Array<keyof typeof SUBJECT_TOPICS>;
```
Import `SUBJECT_SLUGS` everywhere; no re-casting. Consider `satisfies` on `SUBJECT_TOPICS` so the keys are a real union.

---

### L6 — `60_000` vs `60 * 1000` vs `1000 * 60 * 60 * 24` ordering inconsistency (G11)

Covered by L1's fix, called out separately because it's purely a **consistency** issue: `classSessions.ts` uses `60_000`, the API session routes use `duration * 60 * 1000`, the ranking files use `1000 * 60 * 60 * 24`. Pick one convention (named constants) and apply everywhere.

---

## ✅ What's already clean (keep doing this)

- **Boundaries are typed.** Zero `: any` / `as any` in non-test `src/`. Public helpers in `src/lib/` have explicit interfaces and return types (`MatchResult<T>`, `BrowseRankContext`, `SearchGroup`).
- **No suppression debt.** No `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, or `eslint-disable` anywhere in `src/`.
- **No commented-out code**, no author/ticket/date metadata in comments (C1, C5). The `XXX` grep hits are all legitimate (`STU-XXXX` ID templates, phone-format docs).
- **Scoring logic is exemplary (G25, C4).** `matching.ts` / `browseRanking.ts` name every weight as a `const WEIGHTS = { … } as const` with a rationale comment per line, and `SOONNESS_HORIZON_DAYS` is named. M2 is the only blemish.
- **Comments explain *why*, not *what*** — e.g. `moderation.ts:8` ("there is no background job in this app, so this runs on the read paths"), `search/route.ts:13` (scope rationale). This is the C4 ideal.
- **Env is one-command (E1, E2):** `pnpm build`, `pnpm test` (`vitest run`), `pnpm lint`. `package.json` scripts are minimal and standard.
- **Small focused hooks** — `useFetchList` (35 LOC), `useTableSort` (41), `useTopicCertifications` (52) each do one thing with a clean cancellation guard.
- **Law of Demeter respected** — no `a.b.c.d` train-wrecks or deep `?.?.?.` chains found.
- **DRY where it counts** — no duplicated auth/RBAC guards, validation, or business rules across routes; shared logic already lives in `src/lib/` (`classQueries`, `topicRequestVisibility`, `subjects`, `settings`).

---

## Suggested order of work

1. **M2** — dedupe grade scoring (30 min, prevents a real ranking bug). ✅ highest value.
2. **L1 + L6** — add `DAY_MS`/`MINUTE_MS`/`addDays`/`daysBetween` to `datetime.ts`, codemod. (1 h)
3. **L3 + L4** — consolidate date formatting into `datetime.ts`, delete local copies. (1–2 h)
4. **M3** — `portalPath()` helper, refactor `search/route.ts` + `intents.ts`. (1 h)
5. **L2 + L5** — shared `pagination.ts` and `SUBJECT_SLUGS` exports. (1 h)
6. **M1** — split `SessionTestBuilder` / `QuestionBankManager` / `SubjectTopicManager`. Schedule as its own task; do it opportunistically when next touching those files (Boy-Scout rule).

None of the above changes runtime behaviour; each is independently testable against the existing Vitest suite.
