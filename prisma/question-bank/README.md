# Katuwang question bank

questions.json contains **2,700 original replacement questions**: 20 for each of the 135 current topics across 10 subjects. Each topic has 6 easy, 10 medium and 4 hard questions, with four choices and one correct key per item. The exact current catalogue and grade scopes are preserved.

review.md is the complete readable answer-key export. AUDIT.md and inventory.csv list all topics, counts, sources and limitations. research.json records objectives and source URLs; research-evidence.json records original notes and retrieval hashes. validation.json records automated checks. Authoring notes are supplementary; the seeder reads only questions.json.

```sh
pnpm seed:questions:check
```

This passes for all 2,700 items and checks research-record digests without connecting to a database. Academic review metadata is informational and does not block seeding. The check reports `seedContentReady` separately from `productionApproved`; review attestations remain unchanged.

Configure `DATABASE_URL` for the intended database in your local environment or `.env`, run the check, then replace the bank:

```sh
pnpm seed:questions --apply
```

The standalone command does not run the demo seed or create users/classes. It checks the live active catalogue again, then replaces disposable BANK questions and dependent dummy assessment data in one transaction. Affected session tests return to DRAFT; version links to deleted BANK predecessors are cleared. Existing users, catalogue IDs and tutor-authored question content are preserved. Additional live active topics or mismatched counts block writes.

New rows remain UNREVIEWED under the application's separate qualification controls until genuine review evidence is recorded there. File approval cannot grant tutor qualification eligibility by itself.

The user authorized seeding without academic review and waived preserving dummy data; no backup or additional deletion prompt is required. Transaction failure rolls back. Structural validation, evidence digests, content flags, exact live catalogue coverage and assessment settings still gate writes. The seeder uses the application's shared TLS/CA configuration, including `AIVEN_CA_CERT`.

Verification: 1,213 tests passed / 65 skipped; TypeScript, targeted ESLint and 278 independent numerical checks passed. Live database and browser QA remain outstanding.
