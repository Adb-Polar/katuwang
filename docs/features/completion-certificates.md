# Completion certificates

## Completion and eligibility

The existing tutor **Manage Class → Finish Class → Confirm** action is the issuance event. Its confirmation explains that it certifies the current roster. This action marks remaining scheduled sessions completed and closes their pretests, as before. It now stamps `TutorClass.completedAt` and inserts certificate snapshots in the same class-row-locked transaction.

Finishing an individual session, elapsed scheduled time, assessment scores, and reading a dashboard do **not** issue a certificate. The platform currently has no attendance register or additional learner completion requirement. Recipients are the active, non-withdrawn learner enrollments at confirmation. At least one session must be non-cancelled. Cancelled, suspended, or banned classes cannot be completed. Completed classes cannot be reopened or cancelled; repeated completion requests return the completed class without reissuing or renotifying.

Historical completed classes with no confirmed completion timestamp are not automatically backfilled. There is no learner-facing issuance endpoint.

## Storage and PDF

Migration: `20261110000000_completion_certificates`. Apply through the existing `pnpm db:deploy` / Render release migration command. It adds a nullable class completion timestamp and the `completion_certificates` table. Existing records need no backfill. The existing explicit test-data reset removes demo certificate rows before their owners/classes; ordinary account and class operations cannot delete issued history.

Each row has an unguessable `KTW-…` identifier, learner/tutor/class references, immutable name/subject/class-code/date snapshots, private PDF bytes (`LONGBLOB`), delivery state, attempts, retry time and a processing lease. A unique `(classId, learnerId)` constraint prevents duplicates, including concurrent requests. Foreign keys retain issued history; account deletion returns a descriptive conflict when the account has certificates. Later profile/catalog/class text edits do not rewrite issued certificates.

`pdf-lib` and `@pdf-lib/fontkit` generate a one-page landscape A4 PDF, using the existing Katuwang SVG logo and bundled licensed DejaVu fonts. Blue, white, and gold styling is printable; accented Filipino names are supported. No school seals, accreditation, signature, or signatory are invented. No official signature is currently configured. A sample PDF was visually inspected and its text extracted during verification.

PDFs are stored in the database rather than an ephemeral local filesystem. No object-storage keys or extra storage credentials are required. Include `assets/certificates` and the logo in deployment artifacts; Next's output tracing configuration includes them. No public certificate-verification page is added; admins can search by Certificate ID in Certificate Management.

## Email and durable job processing

The existing `sendMail` transport now supports PDF attachments for Brevo, Resend, and SMTP. Existing credential variables and provider selection remain unchanged. A missing mail configuration is recorded as a failed certificate delivery, never as success. Email is addressed only to the learner's current registered primary email, never to a client-supplied or recovery address. All automated tests mock delivery.

Completion commits before PDF generation or email is attempted. A Next.js `after()` callback starts a bounded batch of ten queued jobs as a fast path. **Run a persistent worker or a scheduler in deployment** for guaranteed processing of larger classes, failures, or work interrupted by a restart. Do not rely solely on after-response callbacks.

The current Render web service can run the durable poller alongside Next.js with:

```sh
node scripts/render-migrate.mjs && node scripts/render-start.mjs
```

The startup supervisor forwards shutdown signals to both children, bounds the worker's database pool to two connections, and fails the service if either child exits unexpectedly. This keeps the web server and poller on the same revision without creating another paid service. The poller runs only while the web instance is running; free-service idle suspension also pauses polling. The existing after-response fast path still handles newly finished classes, and persisted jobs resume when the instance wakes. For uninterrupted processing independent of web traffic, provision a separate always-on worker using the command below.

Preferred persistent worker (same code revision and database/email configuration as the web service):

```sh
pnpm certificates:process
```

It polls every 15 seconds and handles SIGTERM/SIGINT without starting another batch. For a scheduler instead, run every minute:

```sh
pnpm certificates:process --once
```

Alternatively, configure a scheduler to POST to `/api/internal/certificate-jobs` with `Authorization: Bearer <CERTIFICATE_JOB_SECRET>`. Configure a long random `CERTIFICATE_JOB_SECRET` securely on the web service and scheduler. This variable is needed **only** for the HTTP scheduler; never place it in client code or a repository. The endpoint has no GET variant, no public issuer API, and constant-time authentication.

Workers claim jobs atomically with a five-minute lease and process at most two concurrently. Abandoned leases can be recovered. Failures retry with exponential delays, up to five attempts; administrators can explicitly requeue a failed delivery after fixing the cause. The saved PDF and certificate number are reused. Mail state `SENT` means provider acceptance, not a guarantee that an inbox received the message. As with SMTP/API mail generally, a process interruption after provider acceptance but before its database acknowledgment can lead to a duplicate email on recovery; certificate issuance itself remains duplicate-safe.

## Interfaces and permissions

- Learner dashboard includes a My Certificates preview; `/learner/certificates` shows the full paginated list, details, PDF readiness and downloads.
- `/admin/completion-certificates` adds management navigation, learner/ID search, class-code and subject filters, Philippine calendar issue-date filters, details, private downloads and failed-delivery retries.
- `GET /api/certificates` scopes learners to their own records and allows administrators to list all. It never serializes PDF blobs, processing leases, or registered emails.
- `GET /api/certificates/:id/download` allows the certificate owner or administrators, returns 404 for unrelated users, and disables caching. PDFs that are still being generated return 409.
- `POST /api/admin/completion-certificates/:id/retry` is admin-only and only requeues `FAILED` records. There are no unrestricted edit/delete endpoints.

Apply the migration and configure the worker before enabling this revision in an environment. Keep the worker running from the same release as the web service.

## Verification in this change

- Full suite on the latest test base (132c61e): 1,307 passed, 96 skipped (including database suites not configured for that invocation).
- Separate isolated MariaDB certificate lifecycle suite: 7 passed, covering real completion transactions, unique constraints, concurrent requests/workers, persisted PDF attachments, access controls, retry reuse, and snapshot retention. Email sending was mocked.
- Full migration chain applied successfully to isolated MariaDB 11.4; Prisma reports no schema difference afterward.
- TypeScript, changed-file ESLint checks, production build and whitespace checks passed.
- Chromium checked learner/admin cards and details at 390px and 1280px, filters, retry controls, download links and the empty state using mocked responses. A generated PDF was visually inspected and its text extracted.
- No production database migration, real email, or deployment was performed during verification.

## Main changed files

- `prisma/schema.prisma`, `prisma/migrations/20261110000000_completion_certificates/migration.sql`, and `prisma/resetTestData.ts`.
- `src/lib/certificates/{issuance,jobs,background,pdf,email,access}.ts`, bundled font assets/licenses, and `scripts/process-certificates.ts`.
- `src/lib/mail.ts` for provider-compatible PDF attachments.
- `src/app/api/tutor/classes/[classId]/route.ts` and `src/components/tutor/ClassManageMenu.tsx` for explicit completion, eligibility, atomic issuance and confirmation copy.
- `src/app/api/certificates/route.ts`, `src/app/api/certificates/[certificateId]/download/route.ts`, `src/app/api/admin/completion-certificates/[certificateId]/retry/route.ts`, and `src/app/api/internal/certificate-jobs/route.ts`.
- `src/components/certificates/CertificateList.tsx`, learner dashboard/layout/certificates page and admin layout/completion-certificates page.
- `src/app/api/account/route.ts` for issued-history retention, plus related tests.
- Certificate unit/integration/API/scheduler tests, existing class completion tests and email attachment tests.
- `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `.env.example`, and this guide for dependencies, assets, worker command and setup.
