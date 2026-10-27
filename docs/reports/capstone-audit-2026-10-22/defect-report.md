# Confirmed bugs and suspected issues

No application fixes performed. Confirmed source defects are distinct from live-system reproduction. Probe PASS means defect reproduced, not release acceptance passed. All findings remain OPEN.

## BUG-001 — Inactive accounts retain direct API authority

**Affected module:** Identity / all protected APIs

**Severity:** CRITICAL

**Priority:** P0

**Current status:** CONFIRMED — isolated mocked execution

**Steps to reproduce:** 1. Authenticate tutor. 2. Mark account SUSPENDED/BANNED. 3. Replay GET /api/tutor/question-bank with existing JWT; also call admin guard with banned ADMIN session.

**Expected behavior:** Inactive account is denied on every protected backend call.

**Actual behavior:** Probe received HTTP 200 for suspended tutor and authorized=true for banned administrator. This reproduces handler/guard behavior with mocks; live JWT exploit not performed.

**Root cause:** API handlers/requireAdminSession/requireSuperAdminSession check role only. auth callback exposes inactive status but does not reject session. Proxy excludes /api, so page redirects do not protect endpoints.

**Related source files:** src/lib/permissions.ts:24; src/lib/permissions.ts:50; src/lib/auth.ts:131; src/lib/auth.ts:155; src/proxy.ts; src/app/api/tutor/question-bank/route.ts:15

**Recommended fix:** Centralize active-user authorization for every protected API/upload and server data access. Define revocation latency; refresh/check status appropriately; include role changes/deletion.

**Regression tests required:** All four roles with ACTIVE/SUSPENDED/BANNED/PENDING/DECLINED, deleted user, expired suspension and stale JWT; database unchanged on denial.

**Evidence:** evidence/audit-probes.log; evidence/audit-probes.test.ts

## BUG-002 — Tutor bank exposes qualifying assessment answers

**Affected module:** Tutor qualification / assessment integrity

**Severity:** CRITICAL

**Priority:** P0

**Current status:** CONFIRMED — isolated mocked execution and source trace

**Steps to reproduce:** 1. As active tutor GET /api/tutor/question-bank?subject=MATH. 2. Read options[].isCorrect. 3. Compare pool to pickQuestionIds BANK queries.

**Expected behavior:** Qualification answer keys inaccessible to a tutor who may take that qualification.

**Actual behavior:** Probe confirms response includes isCorrect=true. Endpoint exposes BANK rows and same topic pool feeds certification picker. No live certification was taken.

**Root cause:** Bank browse includes full options and returns raw questions. origin=BANK is shared with certification quizzes; no prior-certified restriction.

**Related source files:** src/app/api/tutor/question-bank/route.ts:30; src/app/api/tutor/question-bank/route.ts:40; src/lib/assessmentPicker.ts:33; src/lib/assessmentSerialize.ts

**Recommended fix:** Separate qualification bank from teaching/test-authoring bank or constrain key access to already-qualified scope; use explicit safe serializers and avoid unrestricted shared keys.

**Regression tests required:** Unqualified tutor cannot fetch correct flags/explanations for qualification pool; authoring still works with authorized teaching pool; direct endpoints and pagination checked.

**Evidence:** evidence/audit-probes.log; source contract catalog

## BUG-003 — Default permits teaching before certification

**Affected module:** Tutor class creation / academic requirements

**Severity:** HIGH

**Priority:** P1

**Current status:** CONFIRMED — configuration/source mismatch; live setting unverified

**Steps to reproduce:** 1. Use empty PlatformSetting table. 2. Register uncertified tutor. 3. Create valid class.

**Expected behavior:** Approved thesis promise of assessed/certified tutors is either enforced before pairing or formally revised with panel approval.

**Actual behavior:** Default requireCertificationForClassCreation=false permits creation without certification. Onboarding explicitly tells tutor to start teaching before assessment.

**Root cause:** Product default and user copy conflict with thesis significance and overview certification promise; deployment DB override not read.

**Related source files:** src/lib/settings.ts:19; src/app/api/tutor/classes/route.ts; src/app/api/register/route.ts:19; docs/reference/thesis.md:317

**Recommended fix:** Choose approved qualification policy; enforce it in creation, request acceptance, publication, matching/enrollment as applicable; migrate settings intentionally and align text.

**Regression tests required:** Uncertified topic blocked under selected policy; certified topic allowed; request acceptance and matching cannot bypass gate.

**Evidence:** Source inspection; existing thesis audit identifies same default

## BUG-004 — Photo/name policy conflicts with strict anonymity claim

**Affected module:** Privacy / peer browsing

**Severity:** HIGH

**Priority:** P1

**Current status:** CONFIRMED — source/document contradiction; policy impact requires decision

**Steps to reproduce:** 1. Read strict anonymity promise in project-overview. 2. Inspect learner tutor API, avatarPrivacy and showTutorRealNames setting. 3. Upload identifiable synthetic portrait in isolated environment.

**Expected behavior:** Implemented identity policy and consent/privacy/thesis statements agree; cross-peer identity exposure follows approved policy.

**Actual behavior:** Peers may see tutor/learner profile pictures by explicit helper policy; learners get tutor image directly, and admin setting can reveal tutor names. Real-person recognizability not evaluated.

**Root cause:** Anonymity documents promise a stricter model than implemented configurable names and peer photo visibility.

**Related source files:** docs/reference/project-overview.md; src/lib/avatarPrivacy.ts; src/app/api/learner/tutors/route.ts; src/app/privacy-policy/page.tsx; src/lib/settings.ts

**Recommended fix:** Approve/document a consistent pseudonymity model or hide identifying images/names across peer boundary. Obtain school/privacy review for actual deployment; no legal compliance claim established by this audit.

**Regression tests required:** 4x4 viewer/target roles; hidden identity absent from all network/SSR/export data; name override and photo consent documented.

**Evidence:** Source comparison; no student images accessed

## BUG-005 — Whitespace-only registration identity passes validation

**Affected module:** Registration

**Severity:** MEDIUM

**Priority:** P2

**Current status:** CONFIRMED — isolated schema execution

**Steps to reproduce:** 1. Submit common registration schema with firstName, lastName and section each three spaces; all other fields valid.

**Expected behavior:** Reject empty-after-trim required fields.

**Actual behavior:** Probe accepts input and transforms all three values to empty strings.

**Root cause:** min(1) runs before trim for names and section.

**Related source files:** src/lib/validations/auth.ts:9; src/lib/validations/auth.ts:14; src/lib/validations/auth.ts:35

**Recommended fix:** Trim before min/max checks consistently; add bounded section/contact checks in registration.

**Regression tests required:** Empty/spaces/tabs/Unicode whitespace rejected; valid spaced names normalized; registration API creates no empty identity rows.

**Evidence:** evidence/audit-probes.log

## BUG-006 — Registration silently drops recovery email

**Affected module:** Registration / password recovery

**Severity:** MEDIUM

**Priority:** P2

**Current status:** CONFIRMED — static data-flow inspection; persistence not executed

**Steps to reproduce:** 1. Register valid payload with recoveryEmail=qa.recovery@example.test. 2. Inspect registerAccount arguments and input/create data. 3. Read User.recoveryEmail in isolated DB.

**Expected behavior:** Validated recovery email is saved and usable for recovery.

**Actual behavior:** Schema accepts recoveryEmail, but public route never passes it; RegisterAccountInput and create data omit it. Profile editing supports it separately.

**Root cause:** Missing field across route-to-service boundary.

**Related source files:** src/lib/validations/auth.ts:25; src/app/api/register/route.ts:47; src/lib/registration.ts:14; src/lib/validations/profile.ts

**Recommended fix:** Pass normalized recoveryEmail through service/create input, or remove field from signup contract if intentionally profile-only; align user-facing form.

**Regression tests required:** Signup retains recovery address; blank becomes null; forgot-password matches persisted address; duplicate recovery policy documented.

**Evidence:** Static route/service/schema comparison

## BUG-007 — Unconfigured mail reports success without delivering links

**Affected module:** Email / recovery / verification / setup docs

**Severity:** MEDIUM

**Priority:** P2

**Current status:** CONFIRMED — source behavior; production configuration unverified

**Steps to reproduce:** 1. In isolated deployment unset SMTP_HOST or MAIL_FROM. 2. Request recovery/verification. 3. Inspect mail sink and sanitized log.

**Expected behavior:** Production required email flows fail deployment readiness when mail unavailable; local fallback behavior documented accurately.

**Actual behavior:** sendMail returns without sending; logs only recipient and subject. README claims reset links are logged, but actual function does not log link content.

**Root cause:** Silent no-op mail fallback applies in all modes; README guidance stale.

**Related source files:** src/lib/mail.ts:76; README.md; src/app/api/auth/forgot-password/route.ts; src/app/api/auth/resend-verification/route.ts

**Recommended fix:** Require SMTP at production startup/readiness when required; use explicit local mail sink; keep public anti-enumeration response neutral and server diagnostic actionable.

**Regression tests required:** Production missing SMTP gate fails readiness; isolated mail sink receives usable link; public unknown/existing email responses remain neutral.

**Evidence:** Source inspection only

## BUG-008 — Avatar visibility helper omits SUPER_ADMIN

**Affected module:** Avatar authorization helper

**Severity:** LOW

**Priority:** P3

**Current status:** CONFIRMED — helper logic; affected UI impact unverified

**Steps to reproduce:** 1. Call canViewProfilePicture with viewerRole=SUPER_ADMIN, targetRole=STUDENT_TUTOR and isSelf=false.

**Expected behavior:** Super-admin inherits approved administrator image visibility.

**Actual behavior:** Helper returns false because it recognizes only ADMIN. Some views fetch images directly, so affected view paths need runtime confirmation.

**Root cause:** Hardcoded role check predates SUPER_ADMIN.

**Related source files:** src/lib/avatarPrivacy.ts:28; src/lib/permissions.ts

**Recommended fix:** Use shared isAdminRole or exhaustive role policy; audit actual helper call sites before changing direct render paths.

**Regression tests required:** Every role pair plus self and guest; super-admin sees authorized images only.

**Evidence:** Static helper branch comparison

## RISK-001 — Capacity, scheduling, reset and submission checks can race

**Affected module:** Data integrity

**Severity:** HIGH

**Priority:** P1

**Current status:** SUSPECTED — missing atomic guard visible; race not executed

**Steps to reproduce:** 1. Synchronize two requests just after precheck. 2. Race final-seat enrollment, overlapping session creation, same reset token, or same attempt with different answers. 3. Inspect DB and notifications.

**Expected behavior:** At most one state transition or final-seat winner; consistent immutable result.

**Actual behavior:** Source checks capacity/overlap/token usedAt/attempt status before transaction, then writes without equivalent conditional lock in key paths. Actual interleavings depend on MariaDB isolation.

**Root cause:** Potential check-then-write race; transaction alone does not make prior reads atomic.

**Related source files:** src/app/api/classes/[classId]/enroll/route.ts:79; src/lib/classSessions.ts; src/app/api/auth/reset-password/route.ts:34; src/app/api/tutor/assessments/[attemptId]/submit/route.ts; src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts

**Recommended fix:** Use conditional updates, appropriate row locking/serialization and retry-safe constraints; gate score/consumption transitions atomically.

**Regression tests required:** Deterministic two-client barriers and injected rollback at each stage on actual disposable MariaDB; duplicate safe 409/no-op.

**Evidence:** Static transaction-boundary analysis; no live race evidence

## RISK-002 — Schedule matching depends on server timezone

**Affected module:** Matching / scheduling

**Severity:** HIGH

**Priority:** P1

**Current status:** SUSPECTED — timezone-sensitive source; deployment impact unverified

**Steps to reproduce:** 1. Fix session to 2026-11-02T07:00:00Z (Monday 15:00 Manila). 2. Match Monday 15:00-17:00 slot under TZ=UTC and TZ=Asia/Manila.

**Expected behavior:** Same intended school-local slot and score independent of host timezone.

**Actual behavior:** matching.ts uses getHours/getDay against unzoned preferred slots; UTC server computes 07:00. UI date formatting follows runtime too.

**Root cause:** No explicit school timezone in matching slot comparison.

**Related source files:** src/lib/matching.ts:102; src/lib/datetime.ts; src/lib/derivedAvailability.ts

**Recommended fix:** Define school timezone explicitly and normalize day/time before scoring; document UTC storage and Manila display/input policy.

**Regression tests required:** Midnight and day rollover, UTC/Manila host, boundary end-time, same input rank equality.

**Evidence:** Static timezone inspection

## RISK-003 — Avatar cloud operations can leave dangling/orphan objects

**Affected module:** Avatar reliability

**Severity:** MEDIUM

**Priority:** P2

**Current status:** SUSPECTED — failure ordering observed; faults not injected

**Steps to reproduce:** 1. Replace avatar. 2. Inject DB failure after old object deletion; also fail cloud deletion on self-removal.

**Expected behavior:** DB always references usable current asset; failed cleanup queued/reconciled.

**Actual behavior:** Old cloud image deleted before successful DB replacement; removal clears DB even when cloud deletion fails. Filename prefix can skip server optimization.

**Root cause:** Cloud storage and DB not transactional; no compensating/reconciliation workflow observed.

**Related source files:** src/app/api/uploadthing/core.ts:34; src/app/api/uploadthing/core.ts:46; src/app/api/user/profile-picture/route.ts

**Recommended fix:** Update DB to validated new asset first, queue old deletion, compensate failures; validate actual image metadata independent of client filename.

**Regression tests required:** Cloud/DB failure matrix and retry callback idempotency; verify object and DB counts after each failure.

**Evidence:** Source ordering only

## RISK-004 — Catalog fallback masks DB outage and inactive taxonomy

**Affected module:** Curriculum / reliability

**Severity:** MEDIUM

**Priority:** P2

**Current status:** SUSPECTED — fallback explicit; inconsistent writes not reproduced

**Steps to reproduce:** 1. Deactivate a static topic in DB. 2. Expire cache and fail catalog read while other model writes remain available. 3. Try class/request creation.

**Expected behavior:** Writes obey authoritative active taxonomy or fail safely.

**Actual behavior:** subjects.ts returns static active defaults on DB read failure; validation may accept a retired topic. Cache is per-process with 60s TTL.

**Root cause:** Availability fallback is reused for authoritative validation.

**Related source files:** src/lib/subjects.ts; src/app/api/admin/topics/[id]/route.ts

**Recommended fix:** Use safe explicit degraded read-only fallback; authoritative writes should fail closed; document cross-process cache invalidation.

**Regression tests required:** Deactivate/rename under DB failure and multiple workers; no resurrected inactive topic accepted.

**Evidence:** Source fallback/caching inspection

## RISK-005 — Existing-attempt submission bypasses current test-access gates

**Affected module:** Learner session tests

**Severity:** MEDIUM

**Priority:** P2

**Current status:** SUSPECTED — policy gap, not proven requirement violation

**Steps to reproduce:** 1. Start valid PRE. 2. Close test, disable tests, moderate class or unenroll learner. 3. Submit existing attempt directly.

**Expected behavior:** Approved resume/submit policy enforced consistently and explained.

**Actual behavior:** Submit checks learner ownership and IN_PROGRESS but does not recheck enrollment, test setting/status or class moderation. Start has richer gates and intentionally supports some resume behavior.

**Root cause:** Lifecycle policy distributed across endpoints.

**Related source files:** src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts; src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts; src/lib/sessionTestAccess.ts

**Recommended fix:** Decide which existing attempts may finish; centralize explicit lifecycle checks, preserving intentional legitimate resume behavior.

**Regression tests required:** Start/read/resume/submit matrix for setting, status, class moderation, cancellation and enrollment changes.

**Evidence:** Source comparison only

## BUG-009 — Generated Next.js route types reject optional admin GET request

**Affected module:** Production build / super-admin account list

**Severity:** BLOCKER

**Priority:** P0

**Current status:** CONFIRMED — generated-route TypeScript execution

**Steps to reproduce:** 1. Generate production route types via Next build (webpack compiled successfully here). 2. Run node node_modules/typescript/bin/tsc --noEmit --incremental false. 3. Inspect generated admin/admins GET parameter check.

**Expected behavior:** All exported route handlers satisfy installed Next.js generated contracts and production type checking exits 0.

**Actual behavior:** TypeScript exits 2: TS2344 at .next/types/app/api/admin/admins/route.ts:42; NextRequest | undefined does not satisfy Request | NextRequest. Initial type check before production route generation passed. Webpack build exited at TypeScript worker stage.

**Root cause:** GET(req?: NextRequest) declares optional first parameter. Installed Next generated ParamCheck requires non-optional Request or NextRequest. This is a concrete type-gate blocker, independent of sandbox Turbopack bind failure.

**Related source files:** src/app/api/admin/admins/route.ts:28; .next/types/app/api/admin/admins/route.ts:42; node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md

**Recommended fix:** Declare GET(req: NextRequest) and adapt tests that call GET without a Request, or use a supported zero-argument handler only if request-dependent sorting/query filters are reworked. Do not disable type checking. Review all optional exported route request parameters.

**Regression tests required:** Generate route types on clean checkout; standalone type check and full production build pass; admin list query/search/sort/pagination tests pass using real NextRequest; non-super-admin callers denied.

**Evidence:** evidence/final-typecheck.log; evidence/build-webpack.log; TC-1401
