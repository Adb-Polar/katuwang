# Global assessment config (replace per-topic config)

**Status:** implemented 2026-09-03
**TODO source:** `docs/TODO.txt` — "Assessment settings should not be by topic
but one settings for all subject and topic and put it in the assessment option"
(and the cut-off "assessment configuration should be on the setting assessment
tab" line above it).

## Before

Each `(subject, topic)` pair could have a `TopicAssessmentConfig` row overriding
the three global defaults in `src/lib/assessmentConfig.ts`:

| field | default | meaning |
|---|---|---|
| `questionCount` | 5 | items served per attempt |
| `passPercent` | 80 | % correct to pass |
| `minBankSize` | 5 | active questions before a topic is assessable |

Admins edited these per topic in `CoveragePanel` inside `QuestionBankManager`
(the question drill-down), via `PATCH /api/admin/assessment-configs`.

## After

One platform-wide value for each of the three fields, applied to every subject
and topic. Edited on **Admin → Settings**, in a new "Assessment" section.
`CoveragePanel` becomes read-only and links to Settings.

## Storage — no migration

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

## Changes

### lib

- **`src/lib/assessmentConfig.ts`** — drop `resolveTopicConfig(row)` and the
  `import type { TopicAssessmentConfig }`. Keep `ASSESSMENT_DEFAULTS`,
  `OPTION_COUNT_MIN/MAX`, `ResolvedTopicConfig`.
- **`src/lib/settings.ts`** — add `ASSESSMENT_SETTING_KEYS` and
  `getAssessmentConfig(): Promise<ResolvedTopicConfig>` (one `findMany` over the
  three keys, parsed, defaulted).

### consumers (all previously `resolveTopicConfig(row)` → now `getAssessmentConfig()`)

- **`src/lib/assessmentStatus.ts`** — drop `topicAssessmentConfig.findMany` from
  the `Promise.all`; resolve one `cfg` and use it for every topic.
- **`src/app/api/admin/assessment-questions/coverage/route.ts`** — same; every
  coverage row now carries the same global `config`; `hasOverride` field removed.
- **`src/app/api/tutor/assessments/route.ts`** — drop the `topicAssessmentConfig`
  lookup at quiz start; use `getAssessmentConfig()`.

### API

- **`src/app/api/admin/assessment-configs/route.ts`** — repurposed from per-topic
  to global. `GET` → `{ questionCount, passPercent, minBankSize }`. `PATCH` →
  body `{ questionCount?, passPercent?, minBankSize? }` (≥1 field), upserts the
  `PlatformSetting` rows, ADMIN-only. URL kept so nothing else needs repointing.
- **`src/lib/validations/assessment.ts`** — `updateTopicAssessmentConfigSchema`
  → `updateGlobalAssessmentConfigSchema` (no `subject`/`topic`; the three ints
  optional; `.refine` at least one present).

### UI

- **`src/components/admin/PlatformSettingsForm.tsx`** — settings split into
  "General" and "Assessment" groups. The Assessment group holds the
  `autoCertifyOnAssessmentPass` toggle plus three number inputs (Questions per
  attempt / Pass % / Minimum bank size), saved on blur via the repurposed
  `/api/admin/assessment-configs` `PATCH`.
- **`src/components/admin/QuestionBankManager.tsx`** — `CoverageRow` loses
  `hasOverride`; `CoveragePanel` is now a read-only readiness strip with a
  "Settings → Assessment" link, no inputs / save.
- **`src/app/admin/settings/page.tsx`** — subtitle mentions assessment tuning.

### seed

- **`prisma/seed.ts`** — the `topicAssessmentConfig.upsert` is replaced by a
  `platformSetting` upsert that sets `assessmentPassPercent = 60` (so the admin
  UI shows a non-default value).

### tests

- `src/lib/__tests__/assessmentConfig.test.ts` — rewritten for
  `getAssessmentConfig()` (prisma mocked).
- `src/app/api/admin/assessment-configs/__tests__/route.test.ts` — rewritten for
  the global GET/PATCH.
- `src/app/api/tutor/assessments/__tests__/route.test.ts` — mock updated
  (`platformSetting.findMany` instead of `topicAssessmentConfig.findUnique`).

## Follow-up — done 2026-09-03

`model TopicAssessmentConfig`, the `topic_assessment_configs` table and the
`User.updatedAssessmentConfigs` relation were removed. Applied to the dev DB with
`prisma db push --accept-data-loss` (dropped the table + its 2 seed rows) rather
than `migrate dev`, because the local migration history is already drifted
(`20260902081727_class_pre_post_tests` is applied but only on an unmerged branch)
and `migrate dev` would have forced a full-database reset. No new migration file.
