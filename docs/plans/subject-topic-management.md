# Admin-editable Subjects & Topics

## Context

`docs/TODO.txt`: *"Admin topic/subject management page (add/edit topics &
subjects) — subjects/topics are currently hardcoded in
`src/lib/subjectTopics.ts`."*

Today the taxonomy is compile-time:

- `enum SubjectArea { MATH ENGLISH SCIENCE FILIPINO ARALING_PANLIPUNAN TLE MAPEH }`
  in `prisma/schema.prisma`.
- `SUBJECT_TOPICS: Record<SubjectArea, string[]>` in `src/lib/subjectTopics.ts`
  is the **only** source of valid topic strings; `isKnownTopic(subject, topic)`
  and `normalizeTopic(raw)` gate every write.
- `subject SubjectArea` is a column on **6 models**: `TopicCertification`,
  `TutorClass`, `TopicRequest`, `AssessmentQuestion`, `AssessmentAttempt`,
  `QuestionRequest`.
- Topics are **denormalised plain strings** on `ClassTopic.topic`,
  `ClassSession.topic`, `TopicRequestTopic.topic`, `TopicCertification.topic`,
  `AssessmentQuestion.topic`, `AssessmentAttempt.topic`, `QuestionRequest.topic`.
- `SubjectArea` is imported by **38 files**; `SUBJECT_TOPICS` by **27**.
- Matching (`src/lib/matching.ts:125`) hard-filters on `klass.subject !==
  criteria.subject`.
- Validation: `z.nativeEnum(SubjectArea)` in `validations/class.ts`,
  `validations/assessment.ts` (×3), `validations/topicCertification.ts`,
  `validations/match.ts`.

Goal: a `Subject` + `Topic` store the admin can edit, with the rest of the app
reading validity from it instead of the static map.

---

## Two paths — pick one before Phase 3

### Path B — string column + catalogue tables  ✅ recommended

Change `subject SubjectArea` → `subject String` **keeping the exact same value**
(`"MATH"`, `"ENGLISH"`, …). Add `Subject` + `Topic` tables purely as the
**editable catalogue and validation source** — no foreign-key column on the 6
models.

- Migration is structural only (`ENUM('MATH',…)` → `VARCHAR`), **no data-value
  change**, **no backfill** of a new column.
- Every `where: { subject: "MATH" }`, `orderBy: { subject: … }`,
  `@@unique([…, subject, topic])`, `@@index([status, subject])` keeps working
  untouched.
- Referential integrity for `subject` stays in app code — which is exactly
  where it lives today (it's an enum; topics are already free strings).
- Blast radius: `~38` type annotations flip `SubjectArea` → `string`; the
  validators switch to a DB lookup; components fetch dropdown options. No
  `select`/`include`/`where` rewrites.

### Path A — full foreign key

Replace `subject SubjectArea` with `subjectId String` + `subject Subject
@relation` on all 6 models; delete the enum.

- Adds DB-level FK integrity (new — the app has none on `subject` today).
- Requires: a data migration that inserts `Subject` rows, adds `subjectId`,
  backfills it via `slug` join, makes it required, drops the old column;
  **plus** rewriting every `subject` reference in `select` / `include` /
  `where` / `orderBy` / compound `@@unique` / `@@index` across the 6 models and
  their ~30 consuming routes; **plus** the same 38 type flips as Path B.
- The repo's migration history is already drifted (Changes.md Parts 17/19/22/23
  all used `db push`), so the backfill must be a **hand-written SQL migration**
  or a `migrate reset` + reseed on dev.

**This plan is written for Path B.** Where Path A differs, it's called out in
_[A-only]_ notes. Decide at the end of Phase 2; Phases 1–2 are identical either
way.

---

## Target schema (Path B)

```prisma
model Subject {
  id        String   @id @default(cuid())
  slug      String   @unique   // "MATH" — identical to the old enum value; what the 6 models store
  name      String   @unique   // "Mathematics" — display label
  order     Int      @default(0)
  active    Boolean  @default(true)  // inactive = hidden from new dropdowns; existing rows keep working
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  topics Topic[]

  @@map("subjects")
}

model Topic {
  id        String   @id @default(cuid())
  subjectId String
  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  name      String                        // stored verbatim on ClassTopic.topic etc.
  order     Int      @default(0)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([subjectId, name])
  @@map("topics")
}
```

_[A-only]_ also: `subject SubjectArea` → `subjectId String` + relation on
`TopicCertification`, `TutorClass`, `TopicRequest`, `AssessmentQuestion`,
`AssessmentAttempt`, `QuestionRequest`; add back-relations on `Subject`; update
their `@@unique`/`@@index` to use `subjectId`; delete `enum SubjectArea`.

---

## Phases

### Phase 1 — tables + seed + DB reader (additive, non-breaking)

**Schema** — add `Subject` + `Topic`. Keep `enum SubjectArea` and every
`subject SubjectArea` column exactly as-is. `prisma db push` (drift) +
`prisma generate`.

**Seed** — `prisma/seed.ts`: upsert one `Subject` per current `SubjectArea`
value (`slug` = enum value, `name` = readable label below), then upsert its
`Topic` rows from `SUBJECT_TOPICS[slug]` with incrementing `order`.

| slug | name |
|---|---|
| MATH | Mathematics |
| ENGLISH | English |
| SCIENCE | Science |
| FILIPINO | Filipino |
| ARALING_PANLIPUNAN | Araling Panlipunan |
| TLE | Technology & Livelihood Education |
| MAPEH | MAPEH |

**New `src/lib/subjects.ts`** — DB-backed, `globalThis`-cached (mirror
`src/lib/settings.ts`; 30–60 s TTL, `invalidateSubjectCache()` called by the
admin write routes):

```ts
getSubjects(opts?: { includeInactive?: boolean }): Promise<Subject[]>
getTopics(subjectSlug: string, opts?): Promise<Topic[]>
subjectExists(slug: string): Promise<boolean>
topicExists(subjectSlug: string, topicName: string): Promise<boolean>   // case-insensitive, mirrors isKnownTopic
```

`src/lib/subjectTopics.ts` stays for now as the **fallback / cache seed** and
keeps `normalizeTopic()` (pure, unchanged).

**Tests** — `src/lib/__tests__/subjects.test.ts` (mock `@/lib/prisma`): cache
hit/miss, `topicExists` case-insensitivity, inactive filtering.

**Verify** — `tsc` / `lint` / full suite still green (nothing consumes the new
tables yet); `pnpm exec tsx prisma/seed.ts` populates `subjects` / `topics`.

**Commit.**

### Phase 2 — admin CRUD

**API** (`ADMIN`-only, Zod, audit rows, `invalidateSubjectCache()` after every
write):

| Route | Method | Body / effect |
|---|---|---|
| `/api/admin/subjects` | `GET` | `{ subjects: [{…, topics: [...] }] }` (includes inactive) |
| `/api/admin/subjects` | `POST` | `{ name, slug }` → create (slug uppercase-snake, unique) |
| `/api/admin/subjects/[id]` | `PATCH` | `{ name?, order?, active? }` (slug is immutable — it's the stored key) |
| `/api/admin/subjects/[id]` | `DELETE` | 409 if any row in the 6 models has `subject == slug`; else delete (cascades topics) |
| `/api/admin/subjects/[id]/topics` | `POST` | `{ name }` → create under the subject |
| `/api/admin/topics/[id]` | `PATCH` | `{ name?, order?, active? }` — **rename**: also `updateMany` the denormalised string on `ClassTopic`, `ClassSession`, `TopicRequestTopic`, `TopicCertification`, `AssessmentQuestion`, `AssessmentAttempt`, `QuestionRequest` in one `$transaction` (old name → new name, scoped by `subject == slug`) |
| `/api/admin/topics/[id]` | `DELETE` | soft (`active: false`) if in use, hard if not — decision below |

`src/lib/validations/subject.ts` — `createSubjectSchema`, `updateSubjectSchema`,
`createTopicSchema`, `updateTopicSchema`. `src/lib/auditLog.ts` — `SUBJECT_*`,
`TOPIC_*` actions + `SUBJECT` / `TOPIC` target types.

**UI** — `src/app/admin/subjects/page.tsx` + `SubjectTopicManager.tsx`
(client): subject list (name, slug, active toggle, order arrows, "Add subject")
→ selected subject's topic list (inline rename, active toggle, reorder, "Add
topic"). Delete guarded by a `ConfirmDialog` that surfaces the 409 "in use"
message. Admin nav: **Subjects & Topics** under the "General" group
(`src/app/admin/layout.tsx`).

**Tests** — one route-test file per route file (401 / validation / 409-in-use /
happy path; rename propagation asserted with the `updateMany` mock).

**Verify** — `tsc` / `lint` / suite green; manual: add a subject + topics,
rename a topic and confirm existing classes/questions show the new name.

**Commit.**

> After Phase 2 the admin can manage the taxonomy, but the rest of the app
> still validates against the static `SUBJECT_TOPICS`. Phase 3 closes that gap.

### Phase 3 — consumers read validity from the DB

Order the work so `tsc` breaks loudly and guides the sweep. Expect a
**red → green cycle** across this phase — commit only at the end.

1. **Validators** — replace `z.nativeEnum(SubjectArea)` with `z.string().min(1)`
   in `class.ts`, `assessment.ts`, `topicCertification.ts`, `match.ts`. Move
   the "is this a real subject/topic" check into each **route** (after
   `safeParse`), calling `subjectExists()` / `topicExists()` and returning the
   existing `400` messages — the routes already do `SUBJECT_TOPICS[subject]
   .includes(topic)` today, so it's a swap, not new logic. Files: every route
   in the `SUBJECT_TOPICS` grep list (~14).
2. **`src/lib/subjectTopics.ts`** — `isKnownTopic` → thin `async` wrapper over
   `topicExists` (or delete it and update callers). Keep `normalizeTopic`.
3. **`src/lib/matching.ts`** — no change needed (compares `subject` strings;
   already a string at runtime). Update the `SubjectArea` type annotations on
   `ClassForMatching` / `MatchCriteria` → `string`.
4. **Type flips** — `import { SubjectArea } from "@prisma/client"` → a local
   `type SubjectSlug = string` (or just `string`). 38 files; mechanical.
5. **Dropdowns** — components that render subject/topic `<select>`s from
   `SUBJECT_TOPICS` (`MatchCriteriaFields`, `ClassScheduleFields`,
   `AcceptRequestModal`, `TopicRequestBrowser`, `EditClassForm`,
   `QuestionBankManager`, `CertificationReviewTable`, `ClassBrowser`,
   `DevDataFactory`, …):
   - server components / pages fetch `getSubjects()` + pass options down;
   - client-only components take a new `subjects` prop from their parent page,
     or fetch `GET /api/subjects` (new thin public-ish read, `ADMIN`+auth) on
     mount. Prefer prop-drilling from the already-server-rendered page.
6. **`src/lib/chatbot/recommend.ts`** — `SUBJECT_KEYWORDS` is keyed by the enum;
   re-key by slug (same strings) and/or load subject list from `getSubjects()`.
7. **Tests** — `subject: "MATH"` **stays valid** (it's a string). Where a route
   now calls `subjectExists`/`topicExists`, add the mock
   (`vi.mock("@/lib/subjects")`). Rewrite `src/lib/__tests__/subjectTopics.test.ts`.
8. Delete `src/lib/__tests__/subjectTopics.test.ts` assertions that pin the
   static list; keep `normalizeTopic` tests.

_[A-only]_ additionally: swap `subject` → `subjectId` in every `where` /
`select` / `include` / `orderBy` and the compound `@@unique`/`@@index`; every
response that exposed `subject` now needs `subject: { select: { slug, name } }`
and a `.map()` to flatten; the seed and ~50 test fixtures move from
`subject: "MATH"` to `subject: { connect: { slug: "MATH" } }` / `subjectId`.

**Verify** — `tsc` / `lint` clean; **full suite green**; `pnpm build`; manual
smoke of every subject/topic dropdown + a match run + an assessment start +
a topic-request post.

**Commit.**

### Phase 4 — drop the enum

**Path B:** change the 6 `subject SubjectArea` columns → `subject String`.
Because the values are unchanged this is `ALTER TABLE … MODIFY subject
VARCHAR(191) NOT NULL` per table. Delete `enum SubjectArea` from the schema.
Do it as a **hand-written migration** (`prisma migrate diff` to generate the
SQL, then hand-place it) or `db push` if the drift makes `migrate` demand a
reset — `db push` on an enum→varchar with identical values is safe (MySQL
widens in place). `prisma generate`; `grep -r SubjectArea src/` returns
nothing.

_[A-only]:_ the full FK migration described under Path A above.

**Verify** — suite green; `pnpm build`; `npx prisma migrate status` /
`db pull` sanity.

**Commit.**

### Phase 5 — docs

- `docs/reference/decisions.md` — new entry: taxonomy moved from a compile-time
  enum to admin-editable `Subject`/`Topic` tables; Path B (string + catalogue)
  vs Path A (FK) and which was taken and why.
- `docs/feature-checklist.md` — mark the admin subject/topic management item
  done; note it under Admin / User-management-adjacent.
- `docs/roles/ADMIN.md` — "Subjects & Topics" section + the new API routes.
- `docs/roles/{LEARNER,TUTOR}.md` — one line that the subject/topic lists are
  admin-managed (were fixed).
- `docs/erd.md` — regenerated by `prisma generate`.
- `docs/TODO.txt` — remove the item.
- This plan → status **Done**.

---

## Risks & decisions

| Item | Note |
|---|---|
| **Deleting a subject/topic in use** | Block hard-delete (409) when any of the 6 models references it; offer `active: false` (soft-hide) instead. Existing rows keep their denormalised topic strings regardless. |
| **Renaming a topic** | Must fan out to the 6 denormalised string columns in one `$transaction`, scoped by subject slug, or old classes/questions show a stale name. Covered in Phase 2. |
| **Renaming a subject** | Only `name` is editable; `slug` is the stored key and is immutable. If a slug rename is ever needed it's a Phase-4-style data migration. |
| **Migration history drift** | Parts 17/19/22/23 all used `db push`. Phase 4 (and the Path A backfill) should use a hand-written migration or accept a dev `migrate reset` + reseed. Never run against a DB with real data without testing on a copy. |
| **Mid-phase red** | Phases 3–4 will not keep `tsc`/tests green between steps. Budget one red→green cycle per phase; commit only at phase boundaries. Do this on a dedicated branch. |
| **`chatbot/recommend.ts` `SUBJECT_KEYWORDS`** | Hand-curated keyword→subject map; re-key by slug, keep the keyword lists. New admin-added subjects won't get keyword matching until someone adds keywords — acceptable (they still appear in dropdowns and exact-name matches). |

## File inventory (Path B)

**New:** `prisma` (2 models), `src/lib/subjects.ts`,
`src/lib/validations/subject.ts`, `src/app/api/admin/subjects/route.ts`,
`src/app/api/admin/subjects/[id]/route.ts`,
`src/app/api/admin/subjects/[id]/topics/route.ts`,
`src/app/api/admin/topics/[id]/route.ts`,
`src/app/api/subjects/route.ts` (read, for client dropdowns),
`src/app/admin/subjects/page.tsx`,
`src/components/admin/SubjectTopicManager.tsx`, plus `__tests__` for each route
+ `src/lib/__tests__/subjects.test.ts`.

**Modified:** `prisma/seed.ts`; `src/lib/auditLog.ts`; `src/lib/subjectTopics.ts`;
`src/lib/matching.ts` (types only); `src/lib/chatbot/recommend.ts`;
the 4 validation files; every route in the `SUBJECT_TOPICS` grep (~14) for the
`subjectExists`/`topicExists` swap; every component in the `SubjectArea` grep
(~24) for the type flip + dropdown source; `src/app/admin/layout.tsx` (nav);
the ~15 route-test files that gain a `@/lib/subjects` mock; docs in Phase 5.
