> **Fix follow-up:** BUG-001, BUG-002 and BUG-009 were subsequently addressed on
> `codex/fix-capstone-backlog`. See the [fix report and current verification](../backlog-fixes-2026-10-22/README.md).
> This audit retains its original findings/results as a historical baseline;
> the remaining audit findings and unverified release gates are not closed by these fixes.

# Katuwang — capstone testing and readiness audit

Audit date: **2026-10-22, Asia/Manila**. Repository checkout: `/home/hikaru/Capstone/katuwang`. Commit: `f53bc71fe7629efa18270e6748e5f9d1a6368a56`.

Scope: repository assessment, safe isolated automated execution, a complete source-derived testing inventory and a defense-readiness plan. **No application code fixes, database migrations, seeds, account operations or production-data changes were performed.** Existing untracked `src/lib/__tests__/datetime.test.ts.fix-stash` was left untouched. Audit files and four mocked reproduction probes are new documentation/evidence artifacts. Build commands updated ignored build outputs only.

## 1. Executive Summary

**Assessment: NOT READY.** One confirmed production build/type blocker and two unresolved critical findings undermine account moderation and tutor qualification integrity. Functional readiness also lacks live role workflows, independent database persistence checks, SMTP/upload delivery evidence, visual/browser testing and a complete successful production build.

The codebase is substantial: **52 feature groups, 78 page routes, 91 API route files exposing 120 methods, 131 component/support files in the component tree, 33 Prisma models and 24 migration SQL files**. The repository includes a thesis and supporting architecture/role/testing documents. Source availability is not a statement that those features work in a deployment.

Executed evidence:

| Check | Actual outcome | Evidence |
|---|---|---|
| Existing Vitest suite | 114 test files, 880 tests passed; exit 0 | [vitest.log](evidence/vitest.log) |
| Initial standalone TypeScript | Exit 0 before production-generated route checks | [typecheck.log](evidence/typecheck.log) |
| Final TypeScript after production type generation | **Exit 2; TS2344 optional admin GET request incompatible with generated route contract (BUG-009)** | [final-typecheck.log](evidence/final-typecheck.log) |
| Full repository lint | Exit 0; 0 errors, 8 warnings | [lint.log](evidence/lint.log) |
| Four isolated defect reproduction probes | 4/4 reproduced the problematic behavior; **4 acceptance checks FAIL** | [audit-probes.log](evidence/audit-probes.log) |
| Default production build | Exit 1; sandbox port binding denied during Turbopack CSS processing | [build.log](evidence/build.log) |
| Webpack fallback build | Compilation succeeded; build worker exited 1 at TypeScript stage without diagnostic; no full build success | [build-webpack.log](evidence/build-webpack.log) |
| Real database, mail, uploads, browsers, load, restore | Not executed; no environment/data isolation established | Explicit statuses in matrix |

Most existing route tests mock authentication and Prisma. They establish handler behavior under fixtures, not HTTP server integration, real authorization cookies, applied migration integrity or durable persistence. Four new probes invoke actual handlers/helpers with mocked dependencies and compare the observed behavior to secure acceptance expectations.

Top actions: fix the production route type blocker (BUG-009); fix inactive-account API authorization (BUG-001); protect certification answer keys (BUG-002); reconcile certification/anonymity policies with the thesis (BUG-003/004); demonstrate atomic concurrency behavior; complete production build and isolated role workflows; collect formal evaluation evidence.

## 2. Repository and Architecture Analysis

**Stack actually installed/configured:** Next.js 16.2.12 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4/DaisyUI 5, NextAuth 4 credentials with JWT, Prisma 7.8 with MariaDB adapter, Zod 4, Vitest 4.1.11 in Node, Recharts, Nodemailer SMTP, UploadThing and sharp. Package manager is pnpm. No separate backend framework, controllers directory, worker/queue service or NoSQL store was found; route handlers and `src/lib` implement the backend.

| Layer | Actual responsibilities | Main sources |
|---|---|---|
| Public/auth pages | Landing samples, registration, login/logout, verification/recovery and status messages | `src/app/page.tsx`, auth pages, `src/components/auth/*` |
| Learner portal | Discovery, matching, class requests, enrollment, tests, progress, reports, profile | `src/app/learner/*`, `src/components/learner/*` |
| Tutor portal | Classes/sessions, qualification, custom questions, session-test authoring/results, rosters, requests | `src/app/tutor/*`, `src/components/tutor/*` |
| Administration | Moderation, approvals, curriculum/bank, flags, reports, audit, super-admin provisioning | `src/app/admin/*`, `src/components/admin/*` |
| Request guards | Optimistic page guards plus API role checks; critical inactive-account gap | `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/permissions.ts` |
| Business services | Matching/scoring, grading, privacy, taxonomy/cache, moderation, notifications, history | `src/lib/*` |
| Persistence | MariaDB/MySQL via Prisma; child rows and unique compound keys | `prisma/schema.prisma`, `prisma/migrations/*`, `src/lib/prisma.ts` |
| External services | SMTP delivery; UploadThing cloud image storage; optional remote DB with TLS CA | `src/lib/mail.ts`, `src/app/api/uploadthing/core.ts`, `src/lib/prisma.ts` |

The installed Next.js route-handler/proxy guides were read before adding audit test code. Next.js 16 names middleware **Proxy**; its own local guide says Proxy is not a complete authorization/session-management solution. The application's matcher guards `/dashboard`, `/admin`, `/tutor`, `/learner`, excluding `/api`.

Repository evidence indexes:

- [Feature inventory](feature-inventory.md) and [CSV](feature-inventory.csv).
- [All pages](page-inventory.csv), [every API method](api-inventory.csv), [method contract catalog](source-contract-catalog.md).
- [Components](component-inventory.csv), [services/hooks/scripts](service-inventory.csv), [actual validation definitions](validation-catalog.md).
- [Models/constraints/relations](database-inventory.csv), [migration history](migration-inventory.csv), [existing tests](existing-test-inventory.csv).
- [File manifest with hashes](repository-file-manifest.csv); 699 source/document/design files inventoried before this report. Text was indexed; binary documents, slide decks, PDFs and embedded thesis diagrams were inventoried but not independently visually verified. Generated `.next`, dependencies, Git internals, environment values and editor state are excluded from that source manifest. This is not a claim of line-by-line semantic verification of every historical design file.

**Configuration/deployment:** `.env`, `.env.example`, `.env.seed` exist. Only variable names/presence are retained in [sanitized environment evidence](evidence/environment-presence.txt). Presence does not prove validity. DB configuration supports local/cloud URL switching, remote TLS certificate verification and CA content/file paths. `NEXTAUTH_URL` and `NEXTAUTH_SECRET`, SMTP settings, and `UPLOADTHING_TOKEN` are external configuration dependencies. No credentials were printed or validated against live services. Database settings were not read or switched. The deployment document labels itself a plan; its hosting/pricing claims were not validated as deployment evidence.

**Frontend → backend → database traces:**

1. `NewClassForm` → `POST /api/tutor/classes` → schema/catalog/grade/certification/overlap checks → `TutorClass` + topics + sessions, class code via `IdCounter`. Count/grade/schedule persistence still requires real DB verification.
2. `LearnerClassActions` → `POST/DELETE /api/classes/[classId]/enroll` → eligibility/capacity/duplicate checks → transaction enrollment, linked request status/history and tutor notification. Capacity precheck is outside the transaction (RISK-001).
3. `TopicRequestManager` → learner request APIs → request/topics/slots/history → tutor accept API creates class and ACCEPTED link → learner enrollment ENROLLED → completion FULFILLED. Race/expiry paths need real transaction evidence.
4. `AssessmentQuizRunner` → tutor attempt start/submit → BANK picker + attempt items + grading → qualification PENDING/CERTIFIED/REJECTED. Session-test authoring bank exposes the same qualification pool's answer flags (BUG-002).
5. `SessionTestBuilder` → draft/test/question/status APIs → one test per session → learner PRE/POST starts/submission → attempt/item rows → tutor/learner/admin chart rollups. This is separate from tutor qualification.
6. `ProfilePictureUpload` → UploadThing middleware/cloud callback → image optimization + cloud cleanup → User image/key fields; admin avatar-action writes moderation/audit. External storage consistency is not transactional (RISK-003).

## 3. Complete Feature Inventory

The **52-row [inventory](feature-inventory.md)** is the detailed deliverable, including module, feature, description, source paths, role, frontend, backend/service, tables, dependencies, implementation status and testing priority. All features have cases in the detailed matrix. The 120 API method rows supplement feature groupings so small operations are not lost in a module summary.

Inventory groups: identity (5); shared/public/portal/search/notifications/chatbot/avatars (7); learner discovery, enrollment, matching, requests/history, tests, progress, reporting and own profile; tutor own profile, schedule/classes/session lifecycle, appeals, roster, qualification, question requests/custom questions, session-test lifecycle/results and request acceptance; admin dashboards/users/approvals/admin provisioning/class moderation/recommendations/appeals/abuse/certifications/bank/config/taxonomy/request moderation/settings/audit/test inspection; operational health/dev tooling/scripts.

**Status interpretation:** 45 IMPLEMENTED = source implementation paths identified, **not acceptance-tested**; 6 PARTIALLY IMPLEMENTED = known unsafe/missing behavior; 1 UNVERIFIED = grouped operational capabilities requiring runtime evidence. Runtime assurance is lower than source implementation coverage. NOT IMPLEMENTED is reserved for absent documented requirements, not intentionally excluded products. BROKEN is not assigned indiscriminately to whole modules when only a specific acceptance check failed; failed behavior is named in defects and matrix.

Disabled capabilities are settings-driven, not assumed missing: nine booleans in `settings.ts`, three numeric assessment config keys and avatar requirement policy. Approval, verification, certification enforcement and auto-certification default off; matching/chatbot/session-tests default on; tutor real names default hidden. Actual deployment values remain unverified.

Legacy `/admin/certifications` and `/admin/question-bank` redirect to the assessment subpages. Landing sample matching/progress are static illustrative data; they are not evidence of live personalized functionality. No unsupported payments, generative AI tutoring, learning-material uploads, attendance tracking or direct messaging is invented.

## 4. User Role and Permission Matrix

Four roles are present in Prisma: `STUDENT_LEARNER`, `STUDENT_TUTOR`, `ADMIN`, `SUPER_ADMIN`. Both admin roles share `/admin`; only super-admin manages administrative accounts.

| Capability | Guest | Learner | Tutor | Admin | Super-admin |
|---|---|---|---|---|---|
| Landing/privacy/auth/recovery | Yes | Yes | Yes | Yes | Yes |
| Learner dashboard/profile/progress | No | Own | No | Admin inspection only where implemented | Same administrative scope |
| Browse classes/verified tutors; match | No | Yes, grade/status filters | Own class management instead | Moderation views | Moderation views |
| Enroll/unenroll | No | Own | No | No impersonated enrollment API | No impersonated enrollment API |
| Create/edit/cancel/renew class requests | No | Own | Accept eligible request | Moderate | Moderate |
| Create/manage classes/sessions/tests | No | No | Own | Moderation and read-only test inspection | Same |
| Qualifying assessment/custom questions | No | No | Own | Bank/config/certification review | Same |
| Session PRE/POST | No | Own enrolled class | Author and view own results | Inspect | Inspect |
| Report abuse | No | Enrolled targets | No learner reporting capability assumed | Review | Review |
| Notifications/search/chatbot | No | Role-scoped | Role-scoped | Role-scoped | Admin role paths |
| Avatar | No upload | Own subject to lock/policy | Own subject to lock/policy | Moderate/own | Same intent; helper omission BUG-008 |
| Real student identity | No | Self only under privacy policy | Self only under privacy policy | Administrative inspection | Administrative inspection |
| User/class moderation, approvals, reports, audit, flags, taxonomy | No | No | No | Yes | Yes |
| Provision/suspend ADMIN accounts | No | No | No | **No** | Yes, protected self/SUPER_ADMIN constraints |
| Dev factory/quick login | Only nonproduction by design | Not a permission boundary | Not a permission boundary | Not a permission boundary | Not a permission boundary |

For every protected method test guest, each wrong role, same-role foreign owner, inactive user and mismatched parent-child IDs. Many existing endpoints use 401 for both missing session and wrong role; record the actual contract, with 403 as the recommended authenticated-forbidden convention. The critical issue is access allowed to an inactive account, not merely the status-code convention.

## 5. Master Functional Testing Checklist

[Master checklist](master-checklist.md) provides feature-specific checkboxes and explicit page/API/component/model cases. [Detailed matrix](test-cases.csv) has **1,401 cases**, of which 1,396 remain planned and five acceptance checks failed (four defect probes and one generated type check). Safe fixtures and exact boundary values are in [test-data.md](test-data.md).

Run each feature's specific cases, then associated method and page cases: authorized normal operation; required/invalid/empty/boundary data; ownership; empty/loading/failure feedback; repeated action; concurrent operation; fresh-read persistence; refresh/relogin; cross-role visible change. These are not assumed satisfied by a control being present.

CRUD is restricted to actual operations. For example, enrollment CREATE/DELETE are separate method cases; custom/admin question CREATE/READ/UPDATE/DELETE have individual API rows; subject/topic deletes retain used history under actual policies; notifications have read/mark-read rather than invented delete; audit and admin session-test inspection are read-only. Account deletion and unimplemented self-deactivation are not invented acceptance requirements.

## 6. Frontend and UI Testing Checklist

The matrix contains **468 explicit page/viewport cases** (78 × six widths), plus 78 normal page/navigation cases and 131 component/support interaction cases. Each page is tested at **320, 375, 768, 1024, 1440 and 1920 CSS pixels**. Browser/visual results are NOT RUN, not presumed passed from successful compilation.

- [ ] For each page: layout without overlap/clipping/unintended horizontal scrolling; images and links resolve; intentional table scrolling local to container.
- [ ] Forms: field labels, required indicators, errors tied to fields, disabled pending actions, correct clear/cancel/success/retry.
- [ ] Modal/confirmation/prompt: focus entry/trap/restore, Escape and keyboard submit, no hidden focus behind dialog.
- [ ] Portal drawers, search, tabs, dropdowns, filters, sorting, pagination, notifications, timetable and theme persistence.
- [ ] Charts: readable colors/contrast, missing data distinct from zero, accessible tabular equivalent, correct tooltip denominator/delta.
- [ ] Browser: exact OS/version logged for Chrome, Edge, Firefox; Safari support explicitly agreed and tested if supported. No compatibility claim made here.
- [ ] Long anonymous IDs/topic names, 200% zoom, keyboard-only navigation, screen-reader labels and loading/error announcements.
- [ ] Status pages, legacy redirects, invalid dynamic IDs, direct restricted URLs, no PII in hidden HTML or client payloads.

## 7. Backend and API Testing Checklist

[api-inventory.csv](api-inventory.csv) has **one row per exported method** with URL, purpose, roles detected in code, query fields, validator names, explicit response statuses, direct DB calls and nearby test path. [source-contract-catalog.md](source-contract-catalog.md) adds method-specific error strings/imports. Direct-query extraction omits transitive helper/provider effects; source traces and service inventory supplement it.

For every method the detailed matrix expands success, authentication where applicable, invalid IDs/foreign parent ownership where applicable, validation/fault and concurrent mutation cases. Verify real HTTP method dispatch (unsupported 405), content type, documented fields and no secret exposure. GET methods may call expired moderation reinstatement; do not assume every read is side-effect free.

API boundary details requiring particular attention:

- NextAuth catch-all GET/POST is provider-routed; use actual callback/session/signout/CSRF flows, not fabricated application JSON.
- UploadThing GET/POST is SDK-routed; verify authenticated middleware plus provider-signed callback, image count/type/size, retries and cloud/DB reconciliation.
- Learner session-test starts accept only uppercase PRE/POST, return DRAFT as not found, block CLOSED, gate new starts by session lifecycle, and catch a unique-start race as resume. Do not erase this intentional behavior while tightening access.
- Many handlers use `req.json()` in outer try/catch, potentially turning malformed client JSON into generic 500; each invalid-request case explicitly verifies it. Chatbot/dev/read-notification routes have distinct fallback parsing behavior.
- `/api/notifications/read` intentionally treats missing/empty IDs as mark-all. Malformed JSON currently falls back to empty body; confirm this does not create unintended mark-all behavior.
- Anonymous `/api/health` exposes only healthy/disconnected status and timestamp; actual connectivity remains untested.
- `/api/dev` is unauthenticated outside production and includes data generation/cleanup. **Do not expose a development server attached to real student data.** Production guard must execute before any DB access. No factory action was run during this audit.

## 8. Database Testing Checklist

The 33-row [model inventory](database-inventory.csv) includes actual mapped table names, keys/indexes and relation/delete declarations. The 24-row [migration inventory](migration-inventory.csv) names created/altered tables and risky statements. None of these SQL migrations was replayed or applied.

Core table families: users/reset/verification tokens, tutor profiles/certifications/counters, subject/topic taxonomy, classes/topics/sessions/enrollments/recommendations, class requests/topics/slots/history, audit/settings, assessment questions/options/attempts/items/question requests, notifications/chatbot misses, appeals/abuse/violations, session tests/questions/attempts/items.

- [ ] Replay all migrations from empty disposable MariaDB, verify migration table and schema match; do not substitute `db push` for migration-history verification.
- [ ] Test unique email/anonymous/class codes and compound certification/enrollment/request/question-position/test-kind constraints independently.
- [ ] Verify nullable fields, defaults, enum states, FK consistency, cascades/restrict behavior and restore after rollback.
- [ ] Topic rename propagates to denormalized classes, sessions, requests, qualifications/questions/attempt metadata as the implementation intends; a subject slug string is not itself a foreign key.
- [ ] Enrollment changes include linked request state/history and notification in one transaction; test forced failure after each stage.
- [ ] Historical question content/options and scores remain interpretable after retirement, deletion requests and published-but-unattempted test edits.
- [ ] Concurrency: capacity, overlap, acceptance, attempt numbering/submission, reset consumption, moderation decisions. Explicitly distinguish compound uniqueness from capacity/transition safety.
- [ ] `TopicRequestHistory.actorId` is a string rather than a User relation; audit identity and retention policy explicitly. Verify before/after snapshot completeness and ordering at equal timestamps.
- [ ] Real pagination/sorting at scale; inspect plans for matching/search/admin counts and FK indexes.
- [ ] Backup/restore a disposable database plus asset references; measure RPO/RTO, count/hash rows and check login/roles after restore. No existing backup success claimed.

**BLOCKED reason:** no newly provisioned, isolated QA database or verified staging fixture was established. Existing `.env` could point to shared/cloud data; its existence is not authorization to mutate it.

## 9. Security Testing Checklist

This review uses object/function/property authorization and authentication categories from the [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x00-header/) and the verification approach described in the [OWASP ASVS guide](https://devguide.owasp.org/en/06-verification/01-guides/03-asvs/). It is a focused code/behavior audit, not an ASVS certification or legal compliance opinion.

| Area | Source evidence and required verification |
|---|---|
| Broken access control | BUG-001 reproduced; enforce active-user checks at API/data layer, not Proxy only |
| Object/property authorization | Test all ID/nested parent combinations and mass-assigned role/status/owner fields; role-only guards insufficient |
| Assessment integrity | BUG-002 reproduced; answer-key protection must cover all alternative endpoints, not quiz serializer alone |
| Injection | Prisma model queries and tagged SELECT 1 seen; no raw-unsafe call found in source scan; literal input/HTML/CSV cases remain unrun |
| XSS | Verify rendered notes/names/questions, chatbot links, external meeting URL schemes, CSV formulas and HTML mail inputs; CSP allows inline scripts/styles, so CSP is defense-in-depth only |
| CSRF/CORS | NextAuth has provider behavior; custom cookie-auth JSON mutation endpoints need actual Origin/content-type/SameSite tests; no blanket claim based on framework |
| Passwords | bcrypt cost 12 in registration/change/reset; shared 8-character minimum, 72 UTF-8 byte cap and small common-password denylist. Check all admin/dev/bootstrap paths separately |
| JWT/session | 8h maximum; role/status reread every 5min in JWT callback; status not enforced by most APIs. Password-change/global revocation not established |
| Recovery/verification | Token hashing/expiry and neutral responses in source; single-consumption races and real delivery pending |
| Upload | 2MB one-image SDK limit; server optimization and safe filename helpers exist. Verify magic bytes/dimensions, filename-based bypass, callback trust, locks and orphan cleanup |
| Sensitive data | Real identities permitted to admin; peer avatars/name override conflict requires policy decision; never copy environment values/cookies/tokens into report |
| Abuse/rate limiting | Login/reset/registration/search/chatbot throttles exist; in-memory/process-local and forwarded IP trust must match proxy deployment; no distributed-limit guarantee |
| Audit | Moderation audit exists, but event coverage, failed operation rollback, tamper resistance and retention need tests |
| Dependencies | Lockfile overrides are not vulnerability evidence. Registry advisory scan not executed; transitive risks unverified |
| Development tooling | Production guards exist; dev-only endpoint exposes identities and can mutate active target. Avoid real data/nonproduction exposure |

No production account was accessed, no destructive security payload was sent, and no secrets were reproduced in audit deliverables.

## 10. Performance and Reliability Testing Checklist

No page-load, API latency, concurrency throughput or memory benchmark was executed. Existing unit-suite durations are test-run timings, not application performance results.

Proposed initial gates, subject to approved target hardware/network and school requirements:

| Measure | Proposed target | Method/evidence |
|---|---|---|
| Warm main-page LCP/INP/CLS | ≤2.5s / ≤200ms / ≤0.1 | Browser traces; 30 navigations; real fixture and width/device recorded |
| Read API / write API p95 | ≤1000ms / ≤1500ms | 100 requests per critical method; separate cold/warm, DB and server latency |
| School pilot load | 20 concurrent sessions, 10min; unexpected 5xx <1%; zero integrity violations | Disposable 1000-user/200-class/10000-attempt dataset; p50/p95/RSS/CPU/query plans |
| Restart/retry | No duplicate enrollment/request/submission and no partial committed state | Restart/disconnect at known transaction boundaries; fresh DB read |
| Restore | Agree RPO/RTO with project owner; measure actual restore | Backup/restore isolated DB/assets; role-workflow verification |

- [ ] Browse/search/matching plans and row counts avoid unbounded candidate/option scans; large test-attempt aggregates remain correct.
- [ ] Slow 3G/offline UI preserves intended answers or clearly warns about unsaved state; retry cannot create duplicates.
- [ ] Server restart preserves persisted state and correctly handles JWT cookies/rate-limit reset/cache rebuild.
- [ ] SMTP/UploadThing/DB partial outage produces safe, recoverable behavior and useful sanitized diagnostics.
- [ ] UTC server vs Manila school timetable identical in meaning; test local midnight/day rollover (RISK-002).
- [ ] Single-instance limitations documented: rate-limiter Map and taxonomy cache not coordinated across processes.

## 11. End-to-End Workflow Testing

All workflows below are **NOT RUN / BLOCKED pending isolated environment**, actual result **Not Executed**. Test accounts and safe values are in test-data.md. Capture UI screenshots, HTTP evidence and independent before/after DB snapshots; successful response alone does not prove persistence.

| Workflow | Starting conditions/accounts | Numbered actions | Expected result and DB/final state |
|---|---|---|---|
| WF-01 Student onboarding | registrationOpen on; approval+verification on; L1/T1 synthetic addresses; local mail sink | 1. Register learner and tutor. 2. Try login unverified. 3. Confirm mail link. 4. Try login pending. 5. A1 approves L1 and declines T1 with QA note. 6. Verify correct status pages. 7. Repeat tutor with approved second fixture | User/IdCounter/TutorProfile/token/audit rows match one logical action; email verified does not bypass approval; approved active user reaches role dashboard; declined user cannot sign in |
| WF-02 Tutor qualification and class | T1 active, sufficient BANK questions, required certification policy enabled, auto-certify off | 1. Request TOPIC_A assessment. 2. Start and reload attempt. 3. Submit fixed passing answers. 4. Verify pending badge. 5. A1 inspects attempt and certifies. 6. Create QA class with two future sessions. 7. Relogin and inspect | One graded attempt/items, one CERTIFIED topic, one class/code with correct topics/sessions. Uncertified attempt to create/publish/accept is rejected according to chosen policy. Known answer-key bypass must be fixed first |
| WF-03 Discovery and enrollment | T1 class published/scheduled, L1 eligible, L2 used for capacity edge | 1. L1 filters tutor/class browse. 2. Auto-match TOPIC_A and preferred slot. 3. Open class detail. 4. Enroll. 5. T1 opens roster/bell. 6. L1 relogs and opens my classes. 7. L1 unenrolls | Enrollment and notification persist, no cross-peer real identities; own dashboard/roster agree; unenrollment removes only own row. Linked request status changes only if such request exists |
| WF-04 Public class-request fulfillment | L1 no suitable class; certified eligible T1/T2; matching on | 1. L1 creates public request. 2. T1 views open pool. 3. Accept with future class. 4. L1 opens notification/request and enrolls. 5. T1 completes session/class. 6. Review all three role views/history | OPEN→ACCEPTED→ENROLLED→FULFILLED with one linked class and chronological snapshots; enrollment is separate from acceptance; no duplicate fulfillment |
| WF-05 Directed request, expiry and renewal | L1/T1/T2 active, request clock fixed | 1. Direct request at T1. 2. T2 tries list/direct accept. 3. Advance to exact 72h expiry. 4. T1 accepts expired ID. 5. L1 renews. 6. L1 edits/cancels another open request | T2 denied; expired hidden and accept rejected; renewal updates lastSubmittedAt/expiresAt and history; cancelled request cannot be accepted; ten-active cap consistent |
| WF-06 Learner diagnostic loop | L1 enrolled; T1 session scheduled; sessionTestsEnabled on | 1. T1 creates draft. 2. Adds ordered three questions and publishes. 3. L1 PRE submits 1/3 correct. 4. T1 completes session. 5. L1 POST submits 2/3. 6. L1/T1/A1 inspect progress and drill-down. 7. Reload and compare SQL | One test/session, same questions/order PRE/POST, scores 33/67 and +34 percentage points from rounded stored scores, one attempt per kind; tutor/admin/learner aggregates agree; no premature key exposure |
| WF-07 Moderation and appeal | A1 active; T1 owns scheduled class; L1 enrolled; second browser holds T1 session | 1. A1 suspends class/account with reason. 2. T1/L1 try pages and direct APIs. 3. T1 appeals class where allowed. 4. A1 approves/rejects. 5. Test suspension expiry/reinstatement | Inactive API operations denied (BUG-001 prerequisite); class state follows decision; appeal/reviewer/audit/notification consistent; expired suspension behavior verified without stale permissions |
| WF-08 Abuse report and review | L1 enrolled T1 class; L2 has no enrollment | 1. L1 reports CLASS/TUTOR. 2. Repeats pending report. 3. L2 attempts report. 4. A1 resolves/dismisses. 5. L1 checks own report history | One pending report/violation set; duplicates and ineligible target denied; one review/audit; only authorized users see report details/status |
| WF-09 Super-admin separation | SA1 active; A1 ordinary ADMIN | 1. A1 enters /admin/admins and calls APIs. 2. SA1 provisions QA second ADMIN. 3. New ADMIN logs in. 4. SA1 suspends/reinstates it. 5. Try self/SUPER_ADMIN modification | A1 rejected independently of UI; hashed new account and audit persist; self/super-admin safety enforced; suspended ADMIN cannot replay direct API |
| WF-10 Curriculum/settings/avatar/recovery | SA1/A1; L1/T1; isolated UploadThing/mail; spare QA topic | 1. Admin creates/renames/deactivates topic. 2. Verify selectors/history. 3. Toggle flags and numeric assessment config. 4. L1 uploads/replaces/removes avatar and admin locks it. 5. Change/reset password via sink. 6. Restart and verify | Taxonomy references/cache coherent; flags persisted; cloud/DB assets consistent; lock honored; password updated and documented session-revocation policy enforced; all administrative changes audited |

For each execution append actual results, exact fixture IDs, DB diffs and final-state evidence in test-cases.csv. A single successful demonstration cannot replace race/negative/regression cases.

## 12. Automated Testing Recommendations

Exact commands executed from repository root:

```text
pnpm test
pnpm exec tsc --noEmit --incremental false
pnpm lint
node node_modules/vitest/vitest.mjs run --maxWorkers=2
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src
node node_modules/vitest/vitest.mjs run src/lib/__tests__/gradeAttempt.test.ts --maxWorkers=1 --reporter=verbose
node node_modules/vitest/vitest.mjs run docs/reports/capstone-audit-2026-10-22/evidence/audit-probes.test.ts --maxWorkers=1 --reporter=verbose
node node_modules/next/dist/bin/next build
DATABASE_URL='mysql://qa:qa@127.0.0.1:9/katuwang_qa_build' node node_modules/next/dist/bin/next build --webpack
```

The synthetic loopback URL in fallback build intentionally prevents any shared/cloud DB connection. The initial default build stopped in compilation, before successful route generation. The repeated direct tool runs were diagnostic fallbacks while initial long-running commands had not yet returned final output; both suite runs ultimately reported 880 tests passing. Do not add their counts together. The final standalone type check after generated route types failed with TS2344 (BUG-009), so the earlier pass is not sufficient release evidence. The extra five grading checks are a subset of the 880. Direct source lint produced one test-fixture warning; full repository lint had eight warnings. No test coverage instrumentation was run, so line/branch coverage is unknown.

Current infrastructure: Vitest Node with tsconfig-path plugin; 114 source test files, extensive route/helper mocks. No configured browser E2E runner, DOM component test environment, or CI workflow was found in the inspected checkout. Vitest warns about future Vite native config loading and redundant tsconfig-path plugin; nonblocking maintenance only.

Recommended staged automation, based on existing stack:

1. **Immediate Vitest regressions:** convert BUG-001/002/005 reproduced failures into secure-behavior assertions when fixes are made. Current audit probes deliberately expect the faulty behavior, so their PASS is reproduction evidence only; do not adopt them unchanged as acceptance gates.
2. **Business unit tests:** fixed clock and timezone matrices for weighted matching, grade eligibility, schedule overlap, request expiry/history, grading/rounding, permission matrix and serialization. Preserve helper tests already present.
3. **Real DB integration:** dedicated MariaDB service in isolated CI; migrations from empty DB; transaction fault injection; unique/FK/deletion/rename tests; two-connection barriers for races. Never load shared `.env` targets in this job.
4. **HTTP API integration:** run actual Next server with disposable DB; real NextAuth cookies/CSRF, active status, role and parent-child boundaries, provider callback verification, network error shapes and DB fresh reads.
5. **Component tests:** DOM-capable Vitest/Testing Library for validation, modal focus, notification state, builder locks, quiz resume/error handling and chart data alternatives; use browser tests for actual layout.
6. **E2E:** Playwright is a proposed addition, not currently installed/configured; run WF-01..10, all release-critical negative paths and six viewport smoke sets. Use Chromium/Firefox/WebKit as automation coverage, plus real supported browsers where required.
7. **Security:** lockfile dependency advisory check (`pnpm audit --prod`) with network access, secret scanning on tracked history/public bundles, passive local/staging web scan after auth setup. No network advisory results claimed.
8. **Build/CI:** immutable dependency install → generate Prisma → typecheck → lint → Vitest → disposable migration/API tests → successful production build → browser gates → sanitized artifacts. Pin supported Node/pnpm and record versions; do not bypass Next's type/build checks to manufacture success.
9. **Regression pack:** role+status+privacy on every endpoint; certification bank separation; capacity/accept/reset/submit races; request 72h boundary; PRE/POST immutability; topic rename and multi-role dashboard reconciliation.

## 13. Detailed Test Case Matrix

The [CSV](test-cases.csv) and [Markdown](test-cases.md) contain full fields requested: ID, module, feature, priority, type, preconditions, safe data, numbered steps, measurable expected result, actual result, status, evidence, related files and defect reference.

**Counts:** 1,401 cases = 1,241 NOT RUN + 155 BLOCKED + 5 FAIL. Planned cases are not credited by the existing suite's aggregate result. The four isolated behavioral acceptance cases are TC-1397..TC-1400; TC-1401 separately FAILS production-generated TypeScript compatibility:

| Case | Secure expectation | Actual isolated result | Status |
|---|---|---|---|
| TC-1397 | Suspended tutor bank call denied without query | 200 and bank queried | FAIL / BUG-001 |
| TC-1398 | Qualification answers not exposed through alternate tutor endpoint | Correct option flag returned from BANK | FAIL / BUG-002 |
| TC-1399 | Banned ADMIN denied by shared guard | authorized=true | FAIL / BUG-001 |
| TC-1400 | Spaces-only required registration fields rejected | Accepted then trimmed empty | FAIL / BUG-005 |
| TC-1401 | Generated production route signature checks pass | Exit 2, TS2344 for optional admin GET request | FAIL / BUG-009 |

For NOT RUN the actual field is “Not Executed”; BLOCKED rows identify required disposable DB/integration setup. Failed checks use mocks and do not establish a live JWT exploit or stored production records.

## 14. Confirmed Bugs and Potential Issues

[Full defect report](defect-report.md) and [CSV](defect-report.csv) contain reproduction, expected/actual, severity/priority, evidence class, confirmed or suspected root cause, exact sources, fix recommendation, regression needs and OPEN status for **14 findings**.

| ID | Severity | Finding | Evidence strength |
|---|---|---|---|
| BUG-001 | CRITICAL | Inactive accounts retain protected API authority | Two isolated executions + source trace |
| BUG-002 | CRITICAL | Tutor bank returns qualification answer keys | Isolated execution + shared BANK picker trace |
| BUG-003 | HIGH | Certification not required by default despite academic promise | Source/config/document mismatch; live override unknown |
| BUG-004 | HIGH | Strict anonymity claim conflicts with peer images/name override | Source/policy contradiction; legal/consent effect not assessed |
| BUG-005 | MEDIUM | Spaces-only required signup fields accepted | Isolated schema execution |
| BUG-006 | MEDIUM | Signup drops validated recoveryEmail | Confirmed static data-flow omission |
| BUG-007 | MEDIUM | Missing mail config silently skips delivery; README fallback claim stale | Static behavior; deployment mail validity unknown |
| BUG-008 | LOW | Avatar helper omits SUPER_ADMIN administrative inheritance | Static helper branch; view impact unverified |
| BUG-009 | BLOCKER | Optional admin GET request fails generated Next route contract | Executed generated-route type check |
| RISK-001 | HIGH | Capacity/schedule/reset/submission prechecks can race | Suspected runtime impact; transaction-boundary evidence |
| RISK-002 | HIGH | Matching slot comparison depends on server timezone | Suspected deployment impact; host-local Date methods |
| RISK-003 | MEDIUM | Cloud avatar cleanup ordering can break references/orphan storage | Fault behavior unexecuted |
| RISK-004 | MEDIUM | Static catalog fallback can revive inactive values during DB outage | Degraded write behavior unexecuted |
| RISK-005 | MEDIUM | Existing attempt submission has different lifecycle gates | Policy unresolved; not automatically a bug |

The Turbopack port-bind failure is environmental. The follow-up generated-route TypeScript error confirms a separate source-level production gate blocker (BUG-009); webpack worker output itself omitted the diagnostic. Eight lint warnings are maintenance findings, not functional failures. No evidence supports a claim that every security vulnerability or UX defect has been found.

## 15. Missing and Incomplete Features

Based on actual code/documents, not a wish list:

- Incomplete active-account enforcement at backend boundaries; qualification confidentiality; recovery-email registration mapping; trim ordering; super-admin helper inheritance.
- Unresolved promise-vs-default certification policy and privacy model. Fix behavior or obtain approved requirement revisions; do not silently reframe academic scope.
- Missing verified **empirical evaluation** evidence for objective 5: reviewed text includes a checklist/plan, not a completed instrument, respondent dataset, measurements and analyzed results. Embedded/binary evaluation evidence, if any, was not independently reviewed and cannot be credited.
- Missing successful full production-build evidence, disposable migration replay/restore evidence, deployed configuration/mail/upload confirmation, role E2E/visual/browser/performance results and durable DB comparisons.
- No configured browser/component integration framework or CI pipeline found. These are quality/process recommendations, not invented end-user features.
- Existing onboarding/setup documentation is stale on three vs four roles, mail fallback/delivery, optional email verification and demonstrated readiness. Installation currently suggests `db push`; reproducibility also needs migration history verification.

Intentionally excluded: payments, monetization, generative tutoring, material/document uploads, predictive analytics. Teacher Moderator was removed by documented decisions and migration; do not label its absence an implementation defect without resolving thesis inconsistencies and approved scope. Avatar uploads are actually implemented and distinct from learning-material uploads.

## 16. Requirements Traceability Matrix

The thesis **is available**, so Chapters 1–3 are not presumed missing. `docs/reference/thesis.md` §1.2 lines 295–307 supplies the general objective and five specific objectives. Audit labels:

| Objective | Actual documented aim | Source feature evidence | Verification gap |
|---|---|---|---|
| OBJ-01 | Core peer tutoring platform modules | F-001..052, excluding specialized objective subsets | Cross-role lifecycle and persistence not verified; critical guards/qualification defect |
| OBJ-02 | Match by subject/topic/grade/availability | Matching, browse, requests, eligibility and scheduling services | Real data/filter consistency, timezone and race checks pending |
| OBJ-03 | Navigation/FAQ/tutoring recommendation chatbot | Deterministic `src/lib/chatbot/*`, role widget/API, miss review | Full intent/role browser evidence and live recommendation privacy pending |
| OBJ-04 | Analytics for learners/tutors/admins | Learner progress, tutor results/roll-up, admin reports | Reconcile denominators, paired scores and real DB aggregations |
| OBJ-05 | Evaluate named ISO/IEC 25010 characteristics | Thesis and QA checklist exist | Completed approved evaluation and measurements not established |

The [53-row matrix](traceability-matrix.md) maps each feature to an objective, an explicitly audit-derived FR identifier, code, test IDs, result/evidence and gap, plus objective 5's evaluation gap. FR labels are not presented as original approved SRS IDs. Implementation objectives may have source support but **zero of five are empirically verified in this audit**.

Unverified academic artifacts: approved proposal/amendment signatures, chapter consistency, embedded architecture/ERD/DFD diagrams, appendix screenshots/forms, completed respondent evaluation/raw data, panel acceptance criteria and school deployment approval. Existing PDF/PPTX/DOCX artifacts were inventoried but not visually inspected. Features added beyond proposal (super-admin/avatar/moderation/history) need requirements/change traceability; plans alone do not establish institutional approval.

## 17. Capstone Academic Readiness Checklist

Use these **12 evidence packages** as an audit-defined documentation denominator; “present” does not mean correct, approved or complete.

| Package | Repository source present? | Current evidence/gap |
|---|---|---|
| 1 Problem/context/objectives | Yes | Thesis/project overview; approval/version consistency unverified |
| 2 Functional/nonfunctional requirements | Yes | Thesis/feature/ISO checklist; reconcile role/privacy/certification changes |
| 3 Architecture/data flow | Yes | Architecture HTML/PDF and diagram assets; binary visuals not verified |
| 4 Schema/relationships/migrations | Yes | Prisma/ERD sources; real replay and ERD consistency pending |
| 5 Roles/privacy/design decisions | Yes | Role docs and decisions; three/four role and anonymity mismatch |
| 6 Installation/environment | Yes | README/example env; safe reproducibility test pending; mail text stale |
| 7 Role user guidance | Yes | Help content and role reference; assess full learner-facing manual adequacy |
| 8 Deployment procedure | Yes | Planning document; live deployment steps not proven |
| 9 Testing plan/cases | Yes | Existing checklists plus this audit; execution largely pending |
| 10 Complete release acceptance results | **No verified complete package** | Unit/probe logs only; no all-gates acceptance evidence |
| 11 Formal ISO evaluation dataset/analysis | **No verified complete package** | Objective 5 evidence not established |
| 12 Operational backup/restore/security acceptance | **No verified complete package** | No completed recovery or school privacy sign-off evidence |

- [ ] All core objectives trace to approved requirements and executed evidence, with limitations disclosed.
- [ ] Zero open BLOCKER/CRITICAL defects; qualification and account moderation gates pass.
- [ ] WF-01..10 and critical API/privacy/race cases pass with fresh DB evidence.
- [ ] Full production build, migrated disposable DB, SMTP/avatar integrations and restart/restore verified.
- [ ] Six viewport sets, supported browsers and accessibility checks documented.
- [ ] Reconcile roles, grade/self-service policies, certification defaults, photos/names and classroom/online meeting scope across thesis/manual/UI.
- [ ] Approve evaluation instrument and standard edition/characteristics with adviser; obtain appropriate participant/guardian/school permissions before any real-student evaluation.
- [ ] Collect anonymized evaluation data, performance/security measurements, analysis and interpretation; avoid claiming legal or ISO compliance from a checklist alone.
- [ ] Demo backup, safe fictional data, role sessions and sanitized evidence folder prepared; disclose known limitations and unrun tests.

## 18. Capstone Defense Demonstration Plan

This is a proposed **25–30 minute script**, not an executed demonstration. Run only after P0 fixes and preflight. Use separate browser profiles for L1, T1, A1 and SA1; fake data exclusively. Do not display passwords, real user lists, SMTP inbox tokens or environment contents to panelists.

| Time | Presenter actions | Observable proof / fallback artifact |
|---|---|---|
| Before panel | Start verified production build with QA DB, open health, check mail sink/uploads and upcoming sessions; record commit/settings | Successful build/start log, health response, migration status, empty error console; offline screenshots available |
| 0–3min | Explain TRIS problem, free peer tutoring and actual four roles; show privacy landing and scope | Five objectives mapped to current features; state deterministic chatbot and descriptive analytics |
| 3–6min | Register fictional learner/tutor; show invalid consent/empty input; verify email and admin approval when configured | Clear validation, correct status pages, anonymous IDs, active role dashboards; controlled mail capture |
| 6–9min | Tutor starts qualification, demonstrates protected in-progress answers, passes; admin reviews/certifies | Attempt/score persisted and badge CERTIFIED; show unqualified alternate bank access denied after fix |
| 9–12min | Tutor creates QA class with location and two sessions; show invalid capacity/overlap; learner browse/match | Saved code/schedule and grade constraints; exact weighted match explanation; no peer real identities |
| 12–15min | Learner submits request; eligible tutor accepts; learner enrolls; tutor roster and notification update | OPEN→ACCEPTED→ENROLLED with history; refresh/relogin and sanitized SQL read confirm durability |
| 15–19min | Tutor builds/publishes three-question test; learner PRE, complete session, learner POST | Shared ordered questions, 33→67 scores, +34 points; tutor/learner/admin views reconcile; missing results not zero |
| 19–22min | Learner reports issue; admin moderates, tutor appeals; replay denied inactive API and wrong-role URL | Report/review/audit evidence; backend rejection as well as hidden controls; resolved history |
| 22–25min | Show help chatbot/navigation and fallback miss; progress/admin analytics; super-admin provision separation | Role-correct links, aggregate/table match, ADMIN denied admin provisioning |
| 25–28min | Show safe avatar policy/settings/recovery; persistence after refresh; summarize tests/limits/recovery plan | Asset/DB consistency and SMTP evidence; exact test counts, known limitations and recovery results |

Panel questions to prepare:

1. Why Next.js route handlers/Prisma/MariaDB, and where is authorization enforced independently of the UI?
2. How do suspended users lose direct API access while JWTs remain valid? What is the revocation latency?
3. How are tutor qualification questions separated from teaching questions so answer keys cannot be harvested?
4. What does anonymity mean when photos or name overrides exist? Which approved policy and consent apply?
5. Why one class contains multiple sessions and one session owns a shared PRE/POST test question set?
6. Why do rounded scores yield a percentage-point gain, and why is that not proof of causation?
7. How do you prevent last-seat oversubscription, double-booking, duplicate acceptance and double submission?
8. Why denormalized subject/topic strings, and how do rename/deactivation/caching preserve historical consistency?
9. Explain matching weights, hard eligibility filters, timezone handling, no-match behavior and deterministic chatbot limits.
10. What is mocked by the 880 tests? Which real database/browser/external integration evidence supports your claims?
11. How do secrets, mail failure, upload callback retries and cloud/database inconsistency get handled?
12. How are backup/restore and deployment reproducibility demonstrated? What are measured RPO/RTO/load limits?
13. Why four roles now if older documents say three? Which thesis revisions are approved?
14. Which ISO edition/characteristics/instrument and respondents support objective 5? What evidence remains unverified?
15. What limitations remain, and what would change for multiple server instances or a larger school?

## 19. Readiness Metrics and Evidence

Metrics separate **source coverage**, **executed unit behavior**, **executed audit acceptance** and **end-to-end verification**. No line-coverage or application-performance number is invented.

| Metric | Formula / numerator / denominator | Result | Evidence and limit |
|---|---|---|---|
| Source feature implementation proxy | Fully source-classified IMPLEMENTED groups / all discovered groups = 45/52 | **86.54%** | feature-inventory.csv; grouping-dependent, ignores partial credit and is not functional completeness |
| Partial and unverified groups | 6/52 partial; 1/52 unverified | 11.54%; 1.92% | Feature status rationale; critical defects can invalidate release despite high structural coverage |
| Planned feature case coverage | Feature groups with specific cases / discovered groups = 52/52 | **100% planned** | Matrix IDs tied to F-001..052; not execution coverage |
| Audit test execution coverage | Executed acceptance cases / all new audit cases = 5/1401 | **0.357%** | TC-1397..1400 isolated mocked executions plus TC-1401 generated type check; 1241 NOT RUN, 155 BLOCKED |
| Audit acceptance pass rate | Passed audit acceptance / executed audit acceptance = 0/5 | **0%** | All five exposed defects; four behavioral and one build/type check; not representative random sample of all features |
| Existing automated-suite pass rate | Passed existing tests / executed existing tests = 880/880 | **100%** | vitest.log, 114 files; repeated runs not additive; mostly mocked handler/helper tests |
| Defect-probe reproduction rate | Reproduced probes / executed probes = 4/4 | **100% reproduction** | Does **not** mean secure behavior passes; same executions are four acceptance failures |
| Critical workflow execution coverage | Executed WF scenarios / planned WF scenarios = 0/10 | **0%** | No real DB/browser workflow executed |
| Critical workflow pass rate | Passed executed WF / executed WF = 0/0 | **N/A / insufficient evidence** | Do not turn unexecuted into PASS or a measured failure rate |
| Requirement verification coverage | Empirically verified thesis objectives / five objectives = 0/5 | **0% verified** | Objective-level acceptance/ISO evidence absent; source mappings exist |
| Documentation presence proxy | Packages with source guidance / 12 audit packages = 9/12 | **75% presence** | §17 lists numerator/denominator; not approved-document completeness |
| Verified documentation completeness | Accepted complete packages / validated package set | **N/A** | No document acceptance rubric, diagram verification or approval evidence established; 75% must not be presented as completeness |
| Unresolved confirmed critical defects | Count open confirmed CRITICAL entries = BUG-001 + BUG-002 | **2** | defect-report.csv, both reproduced with isolated mocks |
| Unresolved confirmed blockers | Count open BLOCKER entries = BUG-009 | **1** | final-typecheck.log; source optional GET parameter |
| Full production build success | Successful complete builds / attempted configurations = 0/2 | **0/2 verified** | Turbopack permission failure; webpack compiled but exited at worker stage; not a generalized product failure rate |
| Runtime migration/persistence/security/browser/performance coverage | Executed environment-specific evidence / required gate set | **Not established** | No live data/service/browser/load evidence collected |

Feature functionality completeness cannot responsibly be assigned a verified percentage here. 86.54% is explicitly a source-implementation proxy. Documentation completeness likewise needs an approved rubric and review; present source packages alone do not certify quality.

## 20. Final Readiness Assessment and Prioritized Action Plan

**NOT READY** is supported by two confirmed critical backend/assessment defects and one confirmed production route type blocker. Broader functional/academic readiness additionally has insufficient evidence. This is a technical assessment, not a guarantee or denial of university approval.

| Order | Action | Required exit evidence |
|---|---|---|
| P0 / before any public demo | Fix inactive API authority, qualification-bank answer disclosure and generated route type incompatibility | Secure assertions replacing reproduction probes; complete role/status and alternate key-path tests pass; real HTTP denial evidence |
| P1 / before core workflow sign-off | Resolve certification and privacy policy contradictions; prove concurrency/expiry/timezone behavior | Approved requirements/settings, cross-peer JSON/HTML evidence, two-client DB race tests and fixed-clock timezone cases |
| P1 / before deployment sign-off | Complete production build on supported host and isolate QA DB/services | Exit-0 full build/start, migration replay, health, SMTP and UploadThing smoke, no shared data mutated |
| P2 / reliability and validation | Fix trim/recovery mapping/mail guidance and role helper; reconcile lifecycle gates and cloud cleanup | Relevant positive/negative persistence and failure-matrix regressions, updated documentation |
| P2 / functional release | Run WF-01..10 and critical API/DB cases, then UI/browser/viewports and performance/restore | Per-case statuses with sanitized logs/screenshots/DB evidence; zero critical failures or unapproved exceptions |
| P2 / academic release | Validate Chapters/diagrams/scope, conduct approved evaluation, complete manual/deployment/recovery docs | Objective traceability, instrument/data/analysis, approved changes and evidence-backed limitations |
| P3 / maintenance | Triage lint/Vite warnings, tighten CSP and multi-instance cache/rate-limit design if deployment requires | Clean maintenance checks and documented deployment assumptions |

Release gates: no unresolved critical/blocker findings; all ten critical workflows pass with independent persistence evidence; role/status/object/privacy boundaries pass; production build/migration/mail/upload/recovery succeed; approved responsive/browser/performance targets met or explicit noncritical exceptions documented; thesis objective 5 and requirement/diagram/manual evidence reviewed. Until those gates are satisfied, do not use the README's “built and working” wording as a readiness conclusion.
