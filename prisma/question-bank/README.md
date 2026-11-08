> Develop rebase update: this branch now starts at develop `75488fb90e41bead2631b0c270f8862430545ea3`. Develop has 10 subjects and 135 topics (2,700 questions required). The 860 questions retain the original 43-topic taxonomy: 118 current topics are missing and 26 original topic keys do not match. No remapping or additional questions were invented. The seed check/apply correctly rejects this mismatch before writes. Earlier 751-test evidence below belongs to the original main-based version.

# Katuwang question bank

`questions.json` is the canonical complete dataset: **860 questions**, covering
all **43 existing seed topics** across **7 subjects**. Every topic has exactly
6 easy, 10 medium and 4 hard questions. Every question has four choices, one
correct answer, an explanation, learning objective and research references.

`review.md` is the readable answer-key export. `AUDIT.md` records all topic
counts, sources, checks and limitations. `research.json` and
`research-evidence.json` document the research. The `authored/` files are readable
original authoring inputs; the seeder reads only the canonical JSON.

From the repository root:

```sh
pnpm seed:questions:check
```

This validates every topic, item and research-record digest without connecting
to a database. It reports academic approval separately from structural validity.
All questions are written and structurally valid; **human academic review is
pending**. Do not label these items production-approved without actual review.

After review, record each item's genuine reviewer/date/checks and set its
`verificationStatus` to `academically-approved`. Recheck the bank, configure
`DATABASE_URL` securely, then seed:

```sh
pnpm seed:questions --apply
```

This standalone command does not run `prisma/seed.ts` or create dummy users and
classes. It deletes the disposable BANK questions and their dependent dummy
assessment data, then inserts this bank in one transaction. It preserves the
subject/topic catalogue and IDs, users and tutor-authored questions. Affected
session tests return to DRAFT so tutors can rebuild their question selections.
No backup/archive step or additional deletion-approval prompt is required.

The live catalogue is checked again before writes. Additional live topics or
validation failures stop the operation. No database connection was configured
in this session, and no live database changes were made.
