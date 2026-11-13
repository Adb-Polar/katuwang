# Archived 135-topic question bank

This directory preserves the older 2,700-question bank from the certificate feature branch for source history and regression tests. Its frozen reference catalog is `src/lib/approvedSubjectCatalog.json`. It is not the active 292-topic catalog.

The current bank is `prisma/data/questions/question-bank.json`: 5,840 questions, 20 for each canonical topic. See [QUESTION_BANK.md](../../QUESTION_BANK.md) for validation, review status, and safe import commands.

```sh
pnpm questions:validate
pnpm seed:questions --dry-run
pnpm question-bank:replace --dry-run
```

`seed:questions`, `seed:questions:check`, and `question-bank:replace` all point to the current bank. The old standalone `prisma/seed-question-bank.ts` checks the active catalog by default and refuses this archived file's mismatched topic keys before writing. Legacy replacement code remains only for historical regression coverage; it must not be used to replace the current live bank.

Archive regression checks explicitly use the frozen historical catalog, preserving their source hashes, answer-position checks, and original difficulty distribution:

```sh
pnpm exec vitest run scripts/question-bank/full-bank.test.ts scripts/question-bank/coverage.test.ts
```

No approval or review attestations are inferred from either archive validation or merging this branch.
