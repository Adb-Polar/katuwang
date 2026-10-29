# Katuwang dev-test feature audit — 2026-10-29

Report completed: 2026-10-29 14:08 PST (UTC+08:00).

## Deployment and scope

- Target: https://katuwang-dev-test.onrender.com — Render service `katuwang-dev-test` (`srv-db9hg37avr4c73e3eaeg`).
- Branch: `feature/brevo-emailer`.
- Tested commit: `8b5d7d6c2612965e8e27f77c21b4feb3e365d411` (documentation merge). Render deploy `dep-dbhdnvg473hc73cersmg` is live. The Brevo/signup-verification functionality is included.
- Merged `docs/role-based-feature-documentation` into this deployment branch as requested. Merge changed only the 11 files under `docs/features/`.
- Checklist: all **69 named features** in `docs/features/02`–`06`, plus the matrix, route reference and caveats. Additional current features checked: super-admin provisioning and profile-photo upload/moderation.
- This is a functional audit, with explicit partial/blocked coverage below. A passed HTTP response is not taken as proof of persistence, delivery, visual correctness or every edge case.

## Result

The application is live and its database health check is connected. Core class, enrollment, request, assessment, notification and moderation workflows worked in the exercised scenarios. Verification/reset messages reached the connected Gmail inbox, and their links completed the respective operations.

**Open live defects:** admin invitation ID collisions; ignored unpublished class creation; incomplete recovery-email behavior; super-admin avatar moderation rejected; malformed registration JSON returns 500. The automated suite also has 17 failures. Settings-audit and documentation discrepancies are source-confirmed below.

No runtime fixes were applied during this audit. Findings remain open for a follow-up change.

## Verification performed

| Layer | Result | Limits |
| --- | --- | --- |
| Deployment | Documentation merge live; post-audit health 200/database connected | Production service `katuwang` was not changed |
| Public/access smoke | 24/24 routes passed | Includes redirects, public guidance, production dev-route blocking and initial API guards |
| Protected API sweep | All 110 protected methods rejected unauthenticated access | Dynamic IDs were deliberately nonexistent; this tests authorization boundaries, not successful business operations |
| Health endpoint | Public 200, database connected | Correctly public, excluded from protected-API count |
| Public browser | 18 cases: 9 routes at 1440px and 390px | No horizontal overflow or uncaught page errors observed |
| Authenticated browser | 50 cases: 44 static desktop pages and 6 mobile checks | Learner, Tutor and Super Admin; dynamic details were exercised selectively |
| CSV export | Admin report downloaded and parsed as 65 CSV rows | Aggregate export, not a scheduled reporting service |
| Automated suite | **970 passed, 17 failed; 128 files (122 passing, 6 failing)** | Failures are listed under F06; live valid-catalog flows passed |
| TypeScript | `npx tsc --noEmit` passed | Lockfile dependencies and generated Prisma client for this branch |
| Lint | 0 errors, 8 warnings | Existing unused-variable warnings in design/seed/test files |
| Email verification | Inbox receipt, valid verification, reused-token rejection and verified login passed | Disposable tutor on a plus-address of the connected mailbox |
| Password recovery | Inbox receipt, reset, reused-token rejection, sign-in with changed password passed | Disposable account only |
| Live business workflows | Class/session CRUD, enroll/leave, PRE/POST tests, progress, requests/acceptance, certification review, moderation, reports, recommendations, taxonomy/question CRUD and notifications exercised | See per-feature matrix and evidence file |

## Findings and reproduction

### F01 — High: super-admin invitation creation returns HTTP 500 on existing anonymous-ID collisions

- **Observed live twice:** `POST /api/admin/admins` with a valid new QA email returned 500. No new admin was created, so invitation activation and standard-admin login could not be reached through this workflow.
- Payload shape: `{"firstName":"QA","lastName":"Audit Admin","email":"<new owned QA address>"}` as seeded Super Admin.
- Render error at `2026-10-29T05:48:32Z`: Prisma `P2002`, `Unique constraint failed on ... users_anonymousId_key`. The admin list already contained `ADM-0001`, `ADM-0002`, `ADM-0003`.
- **Source:** [src/lib/idGenerator.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/lib/idGenerator.ts#L30) only handles the special collision for count 1. It does not synchronize with the highest existing admin suffix or retry arbitrary collisions. [src/app/api/admin/admins/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/admin/admins/route.ts#L162) uses the generated ID to create the new user.
- **Impact:** a valid admin invitation can fail because counter state is behind existing records. Earlier failed requests advance the counter separately; this audit did not modify/reset counters.
- **Suggested fix:** reconcile the counter against existing ADM identifiers and handle unique-ID conflicts safely, with a test covering several existing admin IDs.
- A further repeated privileged creation attempt was blocked by automatic approval review after the issue had reproduced twice. No attempt was made to bypass that block.

### F02 — Medium: creating a class ignores `published:false`

- **Observed live:** create a valid future QA class with `published:false`; HTTP 201 returns `published:true`.
- **Reproduction:** Tutor → `POST /api/tutor/classes`, with valid subject/topics/location/capacity and a future session, plus `"published":false`.
- **Expected:** the class starts unpublished. **Actual:** schema default publication is used; a separate PATCH is needed to unpublish it.
- **Source:** [src/app/api/tutor/classes/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/tutor/classes/route.ts#L110) omits `published` from destructuring/persistence, despite the validator accepting it.
- **Impact:** a supposed draft can enter discovery before its author publishes it.
- **Suggested fix:** persist the submitted boolean, retaining the intended default when omitted; test browse visibility before and after publication.

### F03 — Medium: recovery-email functionality is incomplete across registration and profile editing

- **Observed live on Tutor API:** `PATCH /api/tutor/profile` with `{"recoveryEmail":"qa-recovery-20261029@example.test"}` returns 200 but omits the field. The persistence code drops it, so the success response cannot save it.
- **Source:** [src/app/api/tutor/profile/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/tutor/profile/route.ts#L23) takes only contact/section/grade from validated input and never writes `recoveryEmail`.
- **UI/source check:** both role profile-edit pages render [src/components/profile/ProfileEditForm.tsx](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/components/profile/ProfileEditForm.tsx#L67), which offers contact/section/grade but no recovery-email input. The documentation promises recovery-email editing.
- **Registration source check:** [src/app/api/register/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/register/route.ts#L48) does not pass accepted `recoveryEmail` input into account creation. This omission was source-confirmed; no direct database inspection of that field was performed.
- **Impact:** users cannot reliably configure the documented backup recovery path. Learner PATCH supports it, but the UI does not expose it; Tutor PATCH silently drops it.
- **Suggested fix:** implement a consistent UI/API/core contract, normalize and persist the field, define collision/verification rules, and test actual backup-address password recovery.

### F04 — Medium: Super Admin cannot use avatar moderation shown in the admin UI

- **Observed live:** as `SUPER_ADMIN`, `POST /api/admin/users/<disposable-tutor-id>/avatar-action` with `{"action":"LOCK","reason":"QA audit"}` returns **401 Unauthorized**.
- **Expected:** the higher administrative role can perform the moderation presented by its user-detail UI. **Actual:** API accepts exactly `ADMIN`.
- **Source:** [src/app/api/admin/users/[userId]/avatar-action/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/admin/users/[userId]/avatar-action/route.ts#L20) uses `session.user.role !== "ADMIN"`, while other administrative boundaries use `isAdminRole`.
- The disposable user's photo **upload, database persistence and self-service removal passed**, so this is a role-permission defect rather than a storage-upload failure.
- **Suggested fix:** use the shared administrative-role check, preserve protected-admin/self restrictions as intended, and cover both admin roles with route tests.

### F05 — Low: malformed JSON produces server error on public registration

- **Observed live:** `POST /api/register` with `Content-Type: application/json` and body `{` returns **500**.
- **Expected:** a client-input error, normally 400; no account should be created.
- **Source:** [src/app/api/register/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/register/route.ts#L36) parses JSON inside the generic exception handler, which maps parse failures to 500.
- **Suggested fix:** handle JSON parse failures separately and retain generic 500 for unexpected server faults.

### F06 — Medium: full automated suite is not green after taxonomy changes

`npx vitest run`: **17 failures, 970 passes**. The failing cases generally expect successful operations using old topic fixtures, or mock Prisma incompletely so catalog loading falls back to values that reject those fixtures with 400. Live requests using catalog topics compatible with the learner's actual grade succeeded.

| Failing file | Failing tests |
| --- | ---: |
| `src/app/api/admin/assessment-questions/__tests__/route.test.ts` | 2 |
| `src/app/api/learner/match/__tests__/route.test.ts` | 2 |
| `src/app/api/learner/topic-requests/__tests__/route.test.ts` | 4 |
| `src/app/api/learner/topic-requests/[id]/__tests__/route.test.ts` | 1 |
| `src/app/api/tutor/assessments/__tests__/route.test.ts` | 5 |
| `src/app/api/tutor/topic-certifications/__tests__/route.test.ts` | 3 |

Examples include `Algebraic Expressions` fixtures and `prisma.subject.findMany` missing in a mock. Update the fixtures/catalog mocks to represent the current grade-aware taxonomy, then rerun the suite. These failures are a regression-test maintenance gap; this report does **not** label all six underlying live features broken.

### F07 — Low: merged feature documentation predates deployed functionality

The requested merge is documentation-only and retains older claims. Corrections needed:

| Documentation claim | Current evidence |
| --- | --- |
| SMTP is the token-email transport | Deployment uses `EMAIL_PROVIDER=brevo` and Brevo HTTPS; verification/reset inbox delivery passed |
| Most APIs do not independently reject inactive users | Current handlers use `getActiveServerSession`; a suspended disposable account immediately lost API access |
| No production admin invitation workflow | Super-admin admin-management routes/UI exist, although creation currently hits F01 |
| Recovery email editable in profile | Both profile forms omit it; Tutor API also drops it (F03) |
| Catalog/subject creation payloads omit grade mappings | Current validators require grade levels; grade-aware live fixture selection was necessary |
| Tutor bank unrestricted across topics | Current `certifiedBankTopics`/`certifiedBankWhere` gates bank access by certified topics |

Use the live implementation plus this audit to update `docs/features`, including Super Admin and current avatar features.

### F08 — Low: documented platform-flag audit writes are absent (source-confirmed)

- Feature A20 says flag changes are written with an audit record. [src/app/api/admin/settings/route.ts](https://github.com/Adb-Polar/katuwang/blob/8b5d7d6c2612965e8e27f77c21b4feb3e365d411/src/app/api/admin/settings/route.ts#L80) performs the setting upsert and returns without an audit write. The profile-picture requirement branch behaves similarly.
- The audit changed the approval flag for disposable applicants and restored it successfully. The finding about missing audit emission is based on the handler implementation; no direct database audit-table inspection was performed.
- Assessment-config audit behavior is separate and should not be conflated with this flag handler.
- **Suggested fix:** define the expected audit contract and write flag changes and audit entries transactionally, or correct the documentation if omission is intentional.

## Full named-feature coverage

**Pass** means the specific live/automated checks described were successful; it does not mean every possible branch, browser, race or integration failure was tested. **Partial** names the unverified portion or open issue. **Defect** means the primary feature had an observed failure. **Expected unavailable** is intentional production gating.

| ID | Feature | Outcome | Evidence / boundary |
| --- | --- | --- | --- |
| G01 | Landing experience and privacy information | Pass | Landing and privacy pages rendered on desktop/mobile. |
| G02 | Select role and register | Partial | Learner/tutor signup, approval flags and email issuance passed. Recovery-email input is dropped; malformed JSON returns 500 (F03/F05). |
| G03 | Sign in and route to the portal | Pass | Seeded learner/tutor/super-admin login; disposable verified tutor login; role guards. |
| G04 | Verify email and resend a link | Pass | Verification email received in connected Gmail; valid link accepted; reused token rejected; resend previously exercised. |
| G05 | Request and complete password recovery | Pass | Reset email received; reset succeeded; reused reset token rejected; new password signed in. |
| G06 | Account-state and access guidance | Pass | Public guidance pages, unverified sign-in block, approval/decline states and suspended-session rejection. |
| L01 | Dashboard and weekly schedule | Pass | Dashboard and schedule browser smoke. |
| L02 | Browse, filter and inspect classes | Pass | Browse/mine/filter API reads, class browser and enrolled class detail. |
| L03 | Find tutors and inspect anonymized profiles | Partial | Directory/API/UI passed; every dynamic tutor-profile/eligibility combination was not exercised. |
| L04 | Auto Match | Pass | Live grade/catalog-valid matching and invalid-topic rejection; stale automated fixtures remain (F06). |
| L05 | Enroll in or leave a class | Pass | Enroll, duplicate rejection and leave on new QA classes. |
| L06 | My Classes and attendance information | Pass | My Classes API and browser; enrolled detail and membership changes. |
| L07 | Create and track public/directed class requests | Pass | Grade-valid public/directed request creation, tutor visibility and request-to-class acceptance. |
| L08 | Edit or cancel a class request | Pass | Edit and cancel own QA requests; admin close/reopen; accepted request cleanup. |
| L09 | Take PRE/POST session tests and inspect an attempt | Pass | Author/publish test, start/submit/review PRE and POST; in-progress answers hidden. |
| L10 | Personal progress | Pass | Live paired progress endpoint plus progress browser page. |
| L11 | Report a tutor/class and track review | Pass | Create private report, reject duplicate, admin dismiss and learner listing. |
| L12 | Own profile and shared tools | Partial | Profile/shared tools rendered; recovery-email editing is incomplete (F03). |
| T01 | Dashboard, class listing and teaching timetable | Pass | Dashboard, class list and timetable browser/API smoke. |
| T02 | Create a class with initial sessions | Defect | Creation/scheduling works but published:false is ignored (F02). |
| T03 | Inspect, edit, publish or unpublish an own class | Pass | Class description editing and publication PATCH passed. |
| T04 | Complete, cancel, reopen or delete a class | Pass | Complete, reopen, cancel and delete QA classes; no full transition/race enumeration. |
| T05 | Add, reschedule, complete, cancel or delete a session | Pass | Add/reschedule/delete extra session, reject overlap, complete teaching session. |
| T06 | Browse eligible learner requests | Pass | Open/directed/accepted request API reads and tutor request UI. |
| T07 | Accept request and create a class | Pass | Directed request accepted into class; learner explicitly joined and left. |
| T08 | View anonymized students and relationship history | Pass | Student roster API and tutor Students UI. |
| T09 | Assessment readiness, certification listing and manual requests | Pass | Certification listing; disposable tutor manual request and re-request after rejection. |
| T10 | Start/resume, submit and review certification quizzes | Pass | Start/resume/submit qualifying quiz and admin attempt detail. |
| T11 | Request more assessment questions | Pass | Create more-questions request and dismiss new QA request administratively. |
| T12 | Build, edit, delete, publish and close session tests | Pass | Create/edit draft, set questions, publish and close session test. |
| T13 | Browse bank and manage own custom session questions | Pass | Bank/custom-question reads, custom create/edit/delete; eligible bank after certification. |
| T14 | View class/session results and individual answers | Partial | Tutor aggregate test results passed; all individual attempt drilldown combinations were not replayed live. |
| T15 | Appeal class suspension or ban | Pass | Suspend class, block tutor editing, submit appeal, approve appeal and reinstate. |
| T16 | Own profile and shared tools | Partial | Tutor profile update passed; recovery-email save silently drops the field (F03). |
| A01 | Dashboard and attention queues | Pass | Admin dashboard rendered and attention-queue endpoints responded. |
| A02 | Browse accounts and inspect private detail | Pass | User searches/lists and private detail of disposable QA user. |
| A03 | Suspend, ban or reactivate accounts | Pass | Suspend/reactivate/ban own QA applicant; suspended existing session loses API access immediately. |
| A04 | Review pending registrations | Pass | Create two pending QA applicants, approve/decline, reject repeated review; original setting restored. |
| A05 | Browse global classes and inspect teaching context | Partial | Global list and UI passed; every dynamic class detail was not visited. |
| A06 | Suspend, ban or reinstate classes | Pass | Suspend, ban and reinstate disposable QA class. |
| A07 | Review class appeals | Pass | Tutor appeal and admin approval; reject/duplicate variants also have automated coverage. |
| A08 | Review abuse reports | Pass | Live private class report, duplicate guard and admin dismissal. |
| A09 | Moderate class requests | Pass | Admin closes/reopens QA class request; learner cancellation. |
| A10 | Recommend a class to a learner | Pass | Create/list recommendation and reject duplicate. |
| A11 | Manage subjects and topics | Pass | Create/edit/delete QA subject/topic, rename and grade-aware payloads. |
| A12 | Author, edit, retire and delete bank questions | Pass | Create/read/edit/retire/delete unused QA bank question. |
| A13 | Inspect bank coverage and resolve question requests | Pass | Coverage/readiness reads and tutor request dismissal; no automatic question creation inferred. |
| A14 | Review certification quiz attempts | Pass | Assessment list and actual qualifying-attempt detail. |
| A15 | Approve/reject topic certifications | Pass | Reject/re-request/approve disposable tutor certification; reject repeat review. |
| A16 | Inspect all session tests and diagnostic results | Partial | Admin diagnostic list/results passed; all individual drilldowns remain automated/source coverage. |
| A17 | Platform reports, charts and CSV export | Pass | Live reports API/UI, CSV download and 65-row CSV parsing. |
| A18 | Inspect audit history | Pass | Audit UI/API and moderation history; separate settings-audit gap in F08. |
| A19 | Review chatbot misses | Pass | Chatbot-miss review endpoint and UI; no runtime FAQ authoring inferred. |
| A20 | Configure platform flags and global assessment tuning | Partial | Flags and global tuning read/write/validation passed; flag changes lack documented audit writes (F08). |
| A21 | Own account, shared tools and non-production factory | Partial | Admin settings/help/shared tools passed; existing privileged password was not changed; development factory correctly unavailable. |
| S01 | Own profile display and editing | Partial | Disposable profile section/grade save passed; recovery-email UI/API gaps (F03). |
| S02 | Change own password and sign out | Pass | Disposable tutor password change, wrong-current-password rejection, new-password login and logout. |
| S03 | Notifications, unread counts and deep links | Pass | Workflow notifications, role notification pages and marking individual notifications read. |
| S04 | Role-aware global search | Pass | Learner/tutor/admin search API reads and search-bearing portal UI. |
| S05 | Role-specific help and FAQ navigation | Pass | All role Help pages rendered. |
| S06 | Intent-based assistant and learner recommendations | Pass | Learner/tutor/admin chatbot navigation/help responses; no exhaustive intent/language accuracy claim. |
| S07 | Portal UI, tables, schedules and charts | Pass | 44 authenticated desktop pages plus 6 mobile checks; no overflow/JS/5xx errors; CSV interaction passed. |
| S08 | Taxonomy delivery and caches | Pass | Live taxonomy delivery and QA subject/topic CRUD; no multi-instance cache-expiry stress test. |
| S09 | Platform settings/defaults and action gates | Partial | Flag/tuning writes and validation passed; settings audit gap (F08). |
| S10 | Automatic grading and results aggregation | Pass | Live PRE/POST submission/results and qualifying quiz; unit tests cover grading arithmetic. |
| S11 | Request-driven maintenance, identifiers and SMTP | Pass | Brevo verification/reset inbox delivery; deployment/migration and ID paths; admin counter collision remains F01. |
| S12 | Rate limiting and response security | Partial | 110 protected API methods rejected unauthenticated requests; security headers and automated checks; malformed JSON error remains F05. No load/race security certification. |
| D01 | Development previews, quick login and data factory | Expected unavailable | Render runs NODE_ENV=production: /dev and /api/dev correctly return 404. |
| D02 | Seed and migration operator workflows | Partial | Live startup/migration success observed. Bulk seed/reset/operator destructive workflows intentionally not executed. |

## Data changes, cleanup and remaining limitations

- QA classes and enrollments were created for lifecycle, diagnostics, report/appeal and directed-request tests, then removed. The custom QA question and QA taxonomy/bank rows were removed. The synthetic profile photo was removed from the disposable account after successful upload.
- Cancelled QA requests, reviewed report/history, assessment attempts, notification/audit records and the disposable tutor certification remain as test evidence. Some class-related records cascade when their QA class is deleted.
- New applicant accounts `[owned QA mailbox]` and `[owned QA mailbox]` were left SUSPENDED and DECLINED respectively. The disposable verified tutor `[owned QA mailbox]` was suspended after testing. No active new privileged QA account was created.
- The original registration-approval setting was restored. Other tested platform tuning writes used unchanged values. Production service configuration and data were not modified.
- Temporary session-cookie/credential files are removed after report generation. No API keys, passwords, raw verification/reset tokens or session cookies are included in this report or its evidence export.
- The documented `admin@katuwang.test` default-password fixture could not sign in. This is an unavailable fixture, not proof of an application defect. Super-admin checks passed; full standard-admin invitation/activation verification is blocked by F01.
- Automatic review blocked an extra repeated admin provisioning attempt and a proposed certification change to a seeded tutor. The certification tests were completed safely with a newly created, user-owned disposable tutor instead. Additional admin invitation retries were stopped after two reproductions.
- Bulk seed/reset scripts were not run, and existing privileged passwords were not changed. These actions were unnecessary for the audit. Runtime fixes for the findings were not performed.
- No exhaustive load/race testing, all-device visual certification, accessibility certification, every dynamic result drilldown, timezone/DST campaign or third-party outage simulation was performed. Provider delivery to the connected inbox was verified for the actual verification/reset emails used here.

## Evidence and rerun guidance

`dev-test-feature-audit-2026-10-29-evidence.json` contains sanitized per-check statuses, paths and assertions, plus browser smoke results. Local raw working logs/screenshots were used for diagnosis; private session state is not a deliverable.

Reproduction environment: locked dependencies installed with pnpm 10.11.0; Prisma client generated for the checked-out schema; Node/Vitest tests run using the repository configuration. Run `npx vitest run`, `npx tsc --noEmit`, and `npx eslint .` from the deployment branch. For live checks, use disposable accounts and valid grade/topic mappings from `/api/subjects`; maintain the existing moderation and catalog state, and clean up only records created by the audit.
