# Katuwang topic question seed

The committed dataset contains **5,840 draft multiple-choice questions: 20 for each of the 292 subject/topic pairs across 47 subjects** in the researched catalog. Each item has four choices, one correct answer, an explanation, canonical subject/topic names, grade associations, a stable ID, and a content reference. Each topic has five correct answers in each A–D position. Questions are counted per topic, not separately per grade association.

These are original AI-assisted drafts, **not official DepEd examination items or independently teacher-reviewed questions**. The catalog retains its documented curriculum-version and coverage limits. Related topics share some foundational concept questions; topic context does not imply that every item is globally unique or covers every competency. The bank combines concept identification with worked mathematics, science, kitchen-math, and SQL exercises. It is a starting bank for review, not a validated mastery test.

## Files

- `prisma/data/questions/question-bank.json`: complete static question data consumed by the importer.
- `prisma/data/questions/question-bank-review.csv`: teacher review sheet, including answer keys and explanations. Keep this with administrative materials.
- `prisma/data/questions/concepts.json`: authored concept/definition cards used to build conceptual questions.
- `prisma/data/questions/topic-blueprints.json`: explicit selection of concept cards or exercise modules for every canonical topic.
- `scripts/build-question-bank.py` and `scripts/questions/numerical.py`: deterministic authoring tools. Python 3.10+ and its standard library are sufficient; no database or network calls.
- `prisma/questionBankData.ts`: validates membership, grades, completeness, choices, answer distribution, and IDs before database access.
- `prisma/seedQuestionBank.ts`: imports the static dataset through Prisma.

Content references identify authoring inputs, not independent factual citations or teacher approval. Curriculum sources and their limits remain in `CURRICULUM_SOURCES.md` and `src/lib/verifiedSubjectCatalog.json`.

## Validate and import

From an installed Katuwang checkout:

```bash
pnpm questions:validate                 # file-only validation; no database connection
pnpm seed                              # import subject/topic catalog first
pnpm seed:super-admin                   # only if there is no existing administrator
pnpm seed:questions --dry-run           # inspect planned inserts; no writes
pnpm seed:questions                     # append missing draft questions and options
```

The importer uses the application's configured `DATABASE_URL`. It never prints credentials or creates dummy users. To select an existing ADMIN/SUPER_ADMIN author, supply `--author-id USER_ID` or `SEED_QUESTION_AUTHOR_ID`; otherwise it selects an existing administrator deterministically. If the administrator or catalog topics are missing, it stops before inserting questions.

Optional scope:

```bash
pnpm seed:questions --subject MATH --topic 'Geometry' --dry-run
pnpm seed:questions --subject MATH --topic 'Geometry'
```

All questions enter as `origin=BANK`, `reviewStatus=UNREVIEWED`, `active=true`. They have no fabricated reviewer, competency attestation, or approval evidence. They are available to the existing administrator review workflow and **cannot enter the assessment pool until approved through documented qualified topic review or explicit administrator authorization**. Review subject fit, age appropriateness, factual accuracy, wording, distractors, and answer keys before approving items.

The importer runs in one serializable transaction, inserts questions and choices together, and rolls back on failure. Stable IDs prevent duplicate inserts on reruns. Existing BANK items with the same subject/topic/prompt also prevent duplicate content; tutor-owned copies do not substitute for BANK items. Existing edits, review decisions, disables, locked questions, attempts, published test links, and platform settings remain intact. Old demo content is retained, so an existing database can contain more than 20 total questions per topic. The static dataset itself contains exactly 20.

To replace the active shared bank and synchronize the subject/topic catalog in one transaction:

```bash
pnpm seed:questions --replace --with-catalog --dry-run
pnpm seed:questions --replace --with-catalog
```

Replacement sets superseded `BANK` questions to `active=false`, including legacy subjects. It retains their choices, reviews, attempt links, and published test links. Tutor-owned questions and existing edits/disables to current dataset questions remain intact. It never deletes assessment history or grants review approval. `--with-catalog` participates in the same transaction, so a question import failure also rolls back the catalog changes.

`scripts/run-question-bank-replacement.ts OPERATION_ID` performs a preview, applies the unscoped catalog/bank replacement, and logs a count-only verification summary. It uses the database configured in that execution environment.

For a one-time remote execution, `--operation-id` records completion atomically under a new `questionBankReplacement:<ID>` setting. Repeating that operation skips replacement, so later questions added by administrators are preserved. Operation IDs require an unscoped replacement and must be unique for each intended replacement. A preview never creates the completion record.

The catalog and question seed are separate commands. Neither requires a live-database run during authoring. Creating the dataset itself does not modify a production database.

## Rebuild and verify

```bash
pnpm questions:build
pnpm questions:validate
python3 -m unittest discover -s scripts/questions -p 'test_*.py'
pnpm exec vitest run prisma/__tests__/questionBankData.test.ts
```

Author corrections in the concept cards, blueprints, or exercise modules, then rebuild the JSON and CSV together. Correct already imported or reviewed content through the application's version/review workflow; reseeding deliberately does not overwrite it.

The optional MariaDB integration test is gated by `QUESTION_BANK_TEST_DATABASE_URL`. It requires an empty disposable local database named `question_bank_verification` and a matching `DATABASE_URL`. It checks all 5,840 question inserts, 23,360 option inserts, dry runs, repeated runs, retained edits/reviews and published history, rejected authors, tutor-copy handling, and transaction rollback. It cleans its question/user fixtures afterward. It never accepts a remote host.

## Administrator authorization for assessment use

Administrators can use **Approve bank for assessments** on the Question Bank subject list. Supply the administrative reason and explicitly authorize assessment use. This checks every active, latest, non-demo item before saving any approval, preserves existing valid reviews, locks approved content, and writes an audit entry with the actor, reason, version, and content hash. Retired and tutor-owned questions are excluded. Invalid items roll the entire operation back.

The database records `reviewStatus=APPROVED` and `qualificationApprovalMethod=ADMIN_APPROVAL`; the reviewer-credentials field stays empty. Administrative evidence explicitly records `academicReviewAttested=false`. The UI labels these items **Admin approved for assessments**. This makes the items eligible for tutor assessments under the administrator's policy without asserting independent academic review. Genuine reviews use `QUALIFIED_REVIEW` and retain their reviewer credentials.

Approvals can be revoked through the existing review action; corrected versions require their own approval. Ordinary seeding still creates unapproved drafts and does not fabricate either approval type. Passing an assessment continues to follow the platform's existing tutor-certification settings.
