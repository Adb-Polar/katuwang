# Katuwang curriculum implementation

Implemented locally on `feat/verified-recovery-email`, based on `37a3f35`. No commits or pushes were made. The working tree was clean before starting.

The catalog is a researched, **partial, version-specific subset**, not a complete or DepEd-certified curriculum. See [the readable list](KATUWANG_FINAL_SUBJECT_TOPICS.md) and [source verification report](CURRICULUM_SOURCES.md).

## Counts and coverage

47 subjects, 292 distinct subject/topic records, and 408 topic/grade associations.

| Grade | Available subjects | Topic associations |
| --- | ---: | ---: |
| 7 | 10 | 52 |
| 8 | 10 | 51 |
| 9 | 11 | 73 |
| 10 | 11 | 69 |
| 11 | 24 | 72 |
| 12 | 24 | 91 |

Eleven junior-high learning areas contain 165 distinct domains/specialization categories, with 245 grade associations verified against the official LRMDS indexes. Full legacy guide downloads require portal access. Thirty-six Strengthened SHS courses contain 127 selected content units, with 163 grade associations supported by downloaded official guides and the official Grade 12 guide section. Six are core courses; 30 are selected electives. Academic and Technical Professional tracks and relevant clusters remain attached to their sources. Older SHS ABM/HUMSS/STEM/GAS/TVL strand structures are not inferred for Strengthened courses.

Remaining gaps include current MATATAG/revised K–10 guide extraction, ambiguous TLE Grades 7–8 entries, legacy SHS topic/strand coverage, additional Strengthened electives, and detailed competencies within included domains. Calendar and school/cohort applicability also need separate verification. No missing entries were filled with generated topics.

## Database and application behavior

The existing Prisma `Subject` and `Topic` tables already support IDs, active flags, grade arrays and JSON curriculum evidence. No destructive schema migration is required. Per-grade evidence in `Topic.curriculum.associations` stores grade, official source URL, version, track, strand, cluster where relevant, grade evidence URL, and PDF page where available. Subject descriptions/limitations use `curriculum.note`.

`src/lib/verifiedSubjectCatalog.json` is the curated import source; authenticated application choices come from the database through the existing shared catalog API/hook. Unavailable reads expose no invented fallback choices. Grade changes clear dependent selections. Learner matching, requests, tutor class creation/editing/acceptance and assessment selectors use the catalog; class and match APIs reject topics outside the selected subject/grade. Existing certification and tutor eligibility checks remain in place. Ordinary users cannot create arbitrary catalog entries. Administrator search, grade filtering, evidence display and enable/disable controls use the existing layout and permissions.

Registration/profile already collect Grade 7–12; those workflows do not currently collect separate subject preferences. Tutor subject/topic qualification continues through the existing certification workflow rather than a new profile schema.

The importer reuses only exact subject/topic identities, upserts under existing unique constraints, and retires unmatched choices without deletion. Previously disabled matched subjects/topics stay disabled, including on the first import. Historical classes, requests, certifications, questions, attempts, learner/tutor records and their IDs are not rewritten. Broad Social Studies and Values/Personal Development categories retain their IDs and labels; separate JHS-prefixed slugs hold the official Araling Panlipunan and Edukasyon sa Pagpapakatao areas. No broad certification is automatically transferred to a new official topic. A unique-name collision aborts the entire transaction.

## Applying the catalog

**The configured cloud database was not modified:** the initial inventory failed with MariaDB pool error 45028, and a direct TCP probe returned `ECONNREFUSED`. Live relationship counts and exact matches therefore remain unverified. All writes and browser checks were performed on a disposable local MariaDB database.

Use the existing environment mechanism to select the intended database, back up the catalog, then run:

```sh
pnpm seed:curriculum          # read-only plan: exact matches, unmatched retained rows, reference counts
pnpm seed:curriculum --apply  # catalog-only transaction
node scripts/verify-curriculum.mjs
```

Review the actual-target plan before applying. This is especially important for custom subjects with the same name under a different slug. Restart application instances after a CLI import to clear in-process catalog caches. A rollback restores the catalog snapshot; historical records need no remapping.

The standard `prisma/seed.ts`, package seed command, and Prisma seed entrypoint now import only the researched catalog. The previous demo fixture generator has been replaced, and obsolete demo/reset aliases have been removed. The existing dev-test startup seed hook uses the new catalog revision and never resets user data. Existing demo questions and historical records are retained.

Regenerate the readable reports with `pnpm curriculum:docs`. Source receipts, hashes, original grade-domain links, PDF topic/page evidence, and exclusions are in `prisma/data/curriculum/source-verification-2026-11-11.json`.

## Validation

| Check | Result |
| --- | --- |
| ESLint | Full-repository lint passed; final changed-file lint passed with no warnings/errors |
| TypeScript | `tsc --noEmit` passed |
| Existing and new tests | 144 files passed; 1,227 tests passed; 14 files / 71 tests skipped by environment gates |
| Real MariaDB importer test | Passed separately: repeated import, stable IDs, retained historical class/request/certification records, retired entries, administrator disables, and grade membership |
| Read-only catalog verifier | Passed against the isolated database: 47 subjects / 292 topics, matching grade/source evidence |
| Production build | `next build --webpack` passed; the initial parallel Turbopack attempt was interrupted during resource contention |
| Browser checks | Passed on the production server with system Chromium; no page JavaScript errors |
| Whitespace integrity | `git diff --check` passed |

Browser checks covered administrator search, Grade 7/12 filtering, official source links, subject/topic disable and re-enable, learner Grade 7/11/12 dependent selections, cross-grade server rejection, administrator permission enforcement, tutor assessment/topic selection, and tutor class grade filtering with no custom topic input. Tests used local QA accounts; no emails or external messages were sent. Environment-gated integration tests unrelated to this change were not represented as having run.

## Seed entrypoint replacement

`prisma/seed.ts` now directly invokes the catalog importer. The former demo-data
generator was replaced; `pnpm seed` and Prisma's seed configuration both use the
standard entrypoint. The dev-test startup hook uses the new curriculum revision
and no longer passes `--reset` or demo-volume settings. Seed documentation was
updated to distinguish the new catalog from historical demo accounts.

This follow-up changed scripts only. No cloud database import was attempted.
TypeScript and targeted lint checks passed, along with 8 catalog/seed-helper tests.
