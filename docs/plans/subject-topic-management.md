# Admin-editable Subjects & Topics (full: enum → DB)

## Context

`docs/TODO.txt`: *"Admin topic/subject management page (add/edit topics &
subjects) — subjects/topics are currently hardcoded in
`src/lib/subjectTopics.ts`."* The owner chose the **full** option: make both
subjects and topics database-backed and admin-editable.

This is a **project-sized migration**, not a single feature commit. It rewrites
the `SubjectArea` enum — a value used on 4 models and referenced in ~50 files
and every past migration — into a `Subject` table with foreign keys, plus a
`Topic` table (topics are already plain strings). It needs a real **data
migration** (map existing `subject` enum values → new `Subject` rows and
backfill FKs) and a full test rewrite (every `subject: "MATH"` mock).

Recommendation: do this on its own branch, in the phases below, running
`tsc` + the full test suite after each phase.

## Current state

- `enum SubjectArea { MATH ENGLISH SCIENCE FILIPINO ARALING_PANLIPUNAN TLE MAPEH }`
  (`prisma/schema.prisma`).
- `subject SubjectArea` fields on: `TutorClass`, `TopicCertification`,
  `QuestionRequest`, `AssessmentQuestion`.
- `SUBJECT_TOPICS: Record<SubjectArea, string[]>` (`src/lib/subjectTopics.ts`) —
  the only source of valid topic strings. Topics live as plain `String` on
  `ClassTopic`, `ClassSession.topic`, `TopicCertification.topic`,
  `QuestionRequest.topic`, `AssessmentQuestion.topic`, `TopicRequestTopic.topic`.
- `SubjectArea` imported by ~40 components/routes; `z.nativeEnum(SubjectArea)`
  in `validations/match.ts`, `validations/class.ts`, `validations/assessment.ts`.
- Matching (`src/lib/matching.ts`) compares `klass.subject === criteria.subject`
  (enum equality).

## Target schema

```prisma
model Subject {
  id        String   @id @default(cuid())
  name      String   @unique   // "Mathematics"
  slug      String   @unique   // "MATH" — keeps continuity with the old enum value
  order     Int      @default(0)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  topics              Topic[]
  classes             TutorClass[]
  topicCertifications  TopicCertification[]
  questionRequests     QuestionRequest[]
  assessmentQuestions  AssessmentQuestion[]

  @@map("subjects")
}

model Topic {
  id        String  @id @default(cuid())
  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  name      String
  order     Int     @default(0)
  active    Boolean @default(true)

  @@unique([subjectId, name])
  @@map("topics")
}
```

Each `subject SubjectArea` field becomes `subjectId String` + `subject Subject
@relation`. `Topic` names stay denormalised as strings on the child rows
(`ClassTopic.topic` etc.) — same as today — with `Topic` as the editable
catalogue and a validation lookup, **not** an FK on every child (avoids a
migration of 6 more columns; revisit later if referential integrity is wanted).

The `SubjectArea` enum is **deleted** once nothing references it.

## Phases

### Phase 1 — introduce the tables, keep the enum (no behaviour change)
1. Add `Subject` + `Topic` models. Keep `subject SubjectArea` columns as-is.
2. Seed `Subject`/`Topic` from the current `SUBJECT_TOPICS` (slug = old enum
   value, name = a readable label).
3. New `src/lib/subjects.ts`: `getSubjects()`, `getTopics(subjectSlug)`,
   `subjectExists`, `topicExists` — DB reads with a short in-process cache
   (mirror `src/lib/settings.ts`). `subjectTopics.ts` keeps its static map as
   the cache seed / fallback.
4. Migration + `prisma generate`. `tsc`/tests still green (nothing consumes the
   new tables yet).

### Phase 2 — admin CRUD
1. `GET/POST /api/admin/subjects`, `PATCH/DELETE /api/admin/subjects/[id]`
   (rename, reorder, activate/deactivate; block delete when in use).
2. `POST /api/admin/subjects/[id]/topics`, `PATCH/DELETE .../topics/[topicId]`.
3. `src/app/admin/subjects/page.tsx` + `SubjectTopicManager` component
   (subject list → topic list, inline add/rename/reorder/disable). Admin nav
   item under "General".
4. Audit actions `SUBJECT_*` / `TOPIC_*`.

### Phase 3 — cut consumers over to the DB (behind the same string values)
Because `Subject.slug` == the old enum value, most call sites can switch from
`SubjectArea` to `string` with **no data change**:
1. `validations/*` — `z.nativeEnum(SubjectArea)` → `z.string()` refined against
   `subjectExists()` (async refinement, or validate in the route).
2. `matching.ts` — compare on `subject` string (already a string at runtime).
3. Every component: `import { SubjectArea }` → a `string` type + `getSubjects()`
   for dropdowns (server components fetch; client components get a prop).
4. `SUBJECT_TOPICS` usages → `getTopics()` / `topicExists()`.
5. Tests: `subject: "MATH"` stays valid as a string; add `subjectExists` mocks
   where routes now call it.

### Phase 4 — swap the columns to FKs + drop the enum
1. Migration: add `subjectId`, backfill from `subject` via slug join, make it
   required, drop the `subject` enum column, drop `enum SubjectArea`.
2. Update the 4 models + every `select`/`include`/`where` that used `subject`
   to use `subject: { select: { slug: true, name: true } }` or `subjectId`.
3. Full test sweep.

### Phase 5 — docs
`docs/reference/decisions.md` (enum → table, why), `feature-checklist.md`,
role docs, `erd.md`, this plan marked done.

## Risks / notes

- **Data migration correctness** — Phase 4 backfill must cover every existing
  row; do it as a real migration file (not `db push`), test on a copy of the
  dev DB first. The repo's migration history is already drifted (see Changes.md
  Parts 17/19/22/23), so this phase likely needs `migrate reset` on dev with a
  fresh seed, or a hand-written SQL migration.
- **Blast radius** — ~50 files. Phases 3–4 will not keep tests green mid-phase;
  budget for a red→green cycle per phase.
- **Deleting a subject/topic in use** — must be blocked (or soft-delete via
  `active=false`, which the schema supports). Existing classes/questions keep
  their denormalised topic strings even if a `Topic` row is deactivated.
