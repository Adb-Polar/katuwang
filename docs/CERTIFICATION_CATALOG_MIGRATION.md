# Replace certifications for retired catalog topics

The super-administrator-only POST endpoint
`/api/admin/certifications/migrate-catalog` migrates topic certification assignments
after a catalog replacement. It does not alter question approvals, classes,
accounts, assessment attempts, completion certificates or the active catalog.

The default request is a read-only preview:

```json
{
  "operationId": "certification-catalog-20261114",
  "reason": "Owner requested replacement of certifications for retired topics."
}
```

Applying requires the same reason and operation ID, `dryRun: false`,
`confirmReplacement: true`, and the preview's `expectedFingerprint`. Requests
require an active super-admin session and a same-origin request. The function
checks the actor again against the database. All changes and the recovery archive
are written in one serializable transaction. Repeating an applied operation ID
returns its saved result without another migration.

Administrative correspondences live in
`src/lib/certificationCatalogMigration.ts`. They cover, for example:

- Algebraic Expressions & Factoring / Linear Equations & Inequalities →
  Mathematics / Patterns and Algebra.
- Grammar & Sentence Structure → English / Grammar Awareness.
- Balarila → Filipino / Wika at Gramatika.
- Geometry & Measurement → separate Mathematics / Geometry and Measurement rows.
- The former miscellaneous cookery, bakery and welding groups → their current
  TLE specializations.

These are explicit owner-authorized catalog reassignments of existing
certifications, not claims that tutors passed a new assessment. Mapped legacy
and manual certification statuses retain their original dates and approval
provenance; the review note identifies the old assignment and migration.
An assessment-based approval is not reused as evidence for a different scope:
its mapped replacement is pending and the original assessment is unchanged.

If several old assignments map to one target, the migration creates one row and
archives every source. An existing current-topic record always wins and remains
byte-for-byte unchanged, including rejected or pending assessment results.
The migration fails if a configured destination is inactive or missing.

Retired topics without a sufficiently close current equivalent are archived
without a guessed replacement badge. Tutors select an appropriate current topic
and take its assessment. Examples include generic Music Theory & Appreciation,
Scientific Method & Inquiry, and Philippine History; the current catalog divides
these into different competency scopes. Temporary QA topics are also archived.

Original rows, their complete review/approval evidence, and the mapping are
retained in gzip JSON in `seed_data_rebuilds`, revision
`certification-catalog-2026-11-14-v1`, together with the operator, reason and SHA-256.
Each old assignment also has a `CERTIFICATION_CATALOG_REPLACED` audit entry.
No notification or email is sent. Existing current-topic records and prior
assessment attempts remain untouched. Verification requires zero remaining
certification records referencing inactive or missing subject/topic pairs.

The normal manual review endpoint also rejects approval of a retired topic.
The connected curriculum seed creates only current-topic pending assignments,
so it does not recreate these retired certification rows.
