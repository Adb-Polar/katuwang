# Rebuild seeded curriculum activity

The canonical catalog contains 47 subjects, 292 subject/topic pairs, and 408
subject/topic/grade associations. The bank has 20 questions per topic (5,840
questions and 23,360 choices). `pnpm seed` remains a catalog-only import.

`pnpm seed:rebuild` replaces the historical demonstration activity with a
connected dataset generated directly from `SUBJECT_CATALOG` and
`prisma/data/questions/question-bank.json`:

- 408 published scheduled classes, one per subject/topic/grade association,
  plus six completed/cancelled/suspended historical examples.
- 414 sessions and topic-matched practice tests, with five canonical questions
  per test; scheduled tests remain drafts.
- 414 enrollments and 408 dated learner requests, including request history.
- Pending topic certifications and question requests for the demo tutors.
- Six failed, explicitly ineligible synthetic tutor attempts, six tutor-owned
  demo questions, and sample learner pre/post results for progress charts.
- Clearly labeled demonstration reports, an appeal, and historical recommendations.

No tutor qualification or completion certificate is issued by this seed, and no
email is sent. Existing approved bank question IDs, content, choices, reviewer
metadata, locks, and audit records remain intact. Human or administrator edits
to canonical questions cause the rebuild to stop instead of retaining approval
on overwritten content.

## Run

Import the canonical catalog and bank first (`pnpm seed`, `pnpm seed:questions`).
Approve the bank through the documented administrator approval process when it
will be used for tutor assessments. Then run a read-only preview:

```sh
pnpm seed:rebuild --operation-id curriculum-rebuild-20261114 \
  --admin-email existing-super-admin@example.com \
  --reason 'Owner requested replacement of seeded curriculum activity.'
```

Add `--apply` to execute. Only an existing active super administrator may be
recorded as the operator. The script previews again immediately before the
transaction and supplies the exact inventory fingerprint. A changed inventory
aborts the transaction. Repeating the same operation ID returns its recorded
result and does not rebuild or duplicate activity. To deliberately regenerate
the data later, use a new operation ID; the recipe's IDs remain stable.

`prisma/seed-session-tests.ts` is a compatibility entrypoint to this same script;
it no longer generates sessions for retired topic names.

## Scope and recovery

Historical named demo accounts and the exact `gen.tutor.NNN` /
`gen.learner.NNN@seed.katuwang.test` patterns identify seeded activity. Other
accounts, including arbitrary `.test` accounts, are not treated as seeds.
Existing users, passwords, account status, anonymous IDs, profiles, administrator
logins, platform settings, and audit logs are preserved. Fallback demo accounts
for missing grades receive random passwords unless `SEED_DEMO_PASSWORD` is
explicitly configured. Counter allocation checks existing anonymous IDs.

Classes with any non-demo participant, request, recommendation, report, or issued
certificate are retained as a complete graph. Their tutor's certifications and
assessment history are also retained. Requests involving non-demo tutors or
protected classes remain intact. The preview and result report these exceptions.

Unchanged questions matching the archived 2,700-question authored seed,
unused historical `DEMO` bank questions, and unreferenced seed-owned questions
are removed after their demo tests/attempts. Questions still referenced by
preserved history or version chains remain. Independently edited or approved
questions from the archived seed are preserved. Unused inactive catalog rows are
removed; inactive entries still referenced by preserved activity remain for
historical fidelity.

Each operation stores a gzip-compressed recovery snapshot of every removed or
updated curriculum/activity table in `seed_data_rebuilds.backup`, with the
SHA-256 of the uncompressed JSON, actor, reason, revision, counts, and timestamp.
PDFs in archived certificates use base64. Account rows and authentication
secrets are excluded. The archive is committed in the same serializable
transaction as the replacement. An error rolls back both the replacement and
its archive. Keep this archive when taking database backups. Recovery is an
operator task: decompress and verify the hash, restore parent rows before child
rows, and reconcile subsequent live activity before restoring old records.

The automatic Render startup remains catalog-only. A production rebuild must
be explicitly invoked once with an operation ID; it is never part of a normal
app start or automatic deployment.
