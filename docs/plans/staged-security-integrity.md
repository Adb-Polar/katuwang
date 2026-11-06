# Staged security and integrity fixes

Base: latest fetched develop, 7d44290, on fix/staged-security-integrity.

Process each issue separately: implement, run focused regressions and applicable checks, commit, push, deploy the exact commit to katuwang-dev-test, verify through browser interactions, then continue. Do not advance to the next fix until the deployed fix passes verification.

1. Authorization: avatar moderation hierarchy; effective class-edit eligibility; session invalidation; assessment restriction rechecks.
2. Integrity: enrollment capacity locking; tutor scheduling serialization; atomic request acceptance; atomic assessment submission; reset-token consumption; retained session history.
3. Business rules: shared grade eligibility; requested-topic coverage; shared avatar prerequisites.
4. Storage: verified recovery email; publication flag; authoritative catalog; enrollment history; immutable published questions.
5. Assessments: delayed PRE answer disclosure; audited manual certification; demo bank labeling or reviewed replacement.

Confirmed policies: any-grade access; full requested-topic coverage; 15-minute grace period for existing attempts after ordinary closure; manual certification requires reason and evidence; avatars required for tutor publication/request acceptance and learner enrollment; PRE answer keys withheld until POST submission. Certifications will be used with real students, so demo question content requires qualified review before certification use. Confirmed Render workspace: My Workspace (tea-daief5lg1s2s73f0o9u0).

## Fix 1: avatar moderation

Use the shared administrative role predicate for both caller authorization and protected target checks. ADMIN and SUPER_ADMIN may moderate learners and tutors; neither administrator role may be targeted. Preserve current response status, notifications, and audit behavior. Regression coverage checks both actor roles, both learner/tutor roles, and absence of all side effects on protected targets.

Live QA: sign in as each administrator role, warn/lock/unlock a test learner and tutor, confirm notifications and audit records, and verify direct requests cannot target ADMIN or SUPER_ADMIN accounts.

Validation before commit: focused avatar suite 15/15 passes; TypeScript and production build pass; lint 0 errors / 8 pre-existing warnings. Full suite 1,000 passes / 18 failures in seven unrelated files. All 18 failures reproduced on untouched develop in an isolated baseline checkout (13 failures across five files plus 5 across the remaining two). Live verification pending deployment. No schema change in this fix.

Fix 1 deployed as 4fc798a6a81d5b70b959a8f248cf64c5ffaf2f0b, Render dep-dbmpu2e7bikc73bn2shg, live 2026-11-06 17:36 PHT. Health 200/database connected; no error-level runtime logs after deploy. Authenticated Chromium QA as SUPER_ADMIN: learner and tutor lock/unlock actions returned 200, unlocked state persisted after reload, and targeting ADMIN/SUPER_ADMIN returned 400. No browser page errors. Standard ADMIN caller covered by regression tests; live QA used the available seeded SUPER_ADMIN login.

## Fix 2: effective class-edit teaching scope

Share subject, grade, selected-topic and certification checks between creation and editing. Validate retained fields as well as submitted fields, including description-only edits after certification revocation or tutor-grade change. Existing session topics must remain selected. Preserve the documented allowance for custom topic names when certification is disabled. Cancellation/completion without teaching-scope edits stays available to stop an ineligible class.

Fix 2 pre-commit checks: 47 focused class creation/edit tests pass. Full suite: 1,007 passes and the same 18 baseline failures. TypeScript, production build and changed-file lint pass. Live editor and API rejection checks prepared.

Fix 2 deployed as 3a099348a1febbf3417e4ae459c231b2d4f472e5, Render dep-dbmq3vks728c739fqlp0, live 2026-11-06 17:49 PHT. Browser API checks rejected invalid subject and above-tutor target grade (400). A retained uncertified topic also returned 400 with certification enabled. A disposable class covering a certified topic saved through the editor, persisted on reopening, and was restored and deleted afterward. No browser page errors. Some grouped-seed classes lack location/meeting links and are correctly blocked by existing attendance-location validation.

## Fix 3: password session revocation

Add users.sessionVersion with a zero default. Capture it at sign-in and compare it with the live account at every protected server boundary; missing legacy claims are rejected. Password changes and resets increment the version atomically with the hash update. JWT refresh may mark stale sessions inactive, but never adopts the newer version into an older login. Password-change UI signs out and explains the required fresh sign-in. This deployment invalidates existing dev-test sessions. Migration is additive; no existing data is removed.

Fix 3 pre-commit validation: 78 focused tests and the updated 4-test audit fixture pass; 3 real MariaDB integration tests pass after applying the additive migration. Full suite had the 18 baseline failures plus one legacy-claim audit fixture, now corrected and passing. TypeScript, production build and changed-file lint pass. The isolated production app passed Chromium QA: second session 200 before change / 401 immediately afterward, profile change signs out with guidance, new-password login succeeds, and the strong local fixture password is restored. No page errors. User selected isolated password-change QA plus live dev-test session checks, preserving seeded demo passwords.

Fix 3 deployed as eb45a4f34ab2e3dcc175a45254247bbcc0220a67, Render dep-dbmqb2e8bjmc73dv8on0, live 2026-11-06 18:04 PHT. Live Chromium rejected the pre-migration tutor session (401), allowed fresh browser sign-in and class API access (200), exposed a captured version 0, and returned health 200. No browser page errors or error-level runtime logs. Demo passwords unchanged, as requested. Full password-change browser flow and immediate invalidation were verified against the isolated production app.

## Fix 4: assessment access after restrictions change

Recheck testing enablement, current enrollment and class moderation on direct attempt reads/resume and submission. Cancellation blocks in-progress work. Ordinary closure gives attempts started before closure 15 minutes; the earliest applicable PRE/all-testing closure controls the deadline. Missing legacy closure timestamps fail closed. Session/class completion stamps PRE closure in the same transaction without extending an earlier deadline. Submitted-result review is exempt from ordinary window expiry while other access restrictions still apply. Tutor closure dialogs describe the grace period.

Fix 4 pre-commit validation: 107 focused access/start/submit/completion/window tests pass; full suite 1,039 passes / 18 baseline failures / 3 opt-in database tests skipped. TypeScript, changed-file lint and production build pass. Live QA will use a disposable class and authored question, leaving platform-wide settings unchanged.

Fix 4 deployed as b91a335fdb9ebbfb07534985b07177fc0a80983a, Render dep-dbmqfe0u01pc739dg3og, live 2026-11-06 18:13 PHT. Live Chromium: resume during ordinary PRE closure grace 200, submission through the runner 200, moderated read/submission 403, and withdrawn read/submission 403. No page errors; disposable class/question cleaned. No error-level logs after deployment.

## Fix 5: enrollment and capacity serialization

Lock the class row inside the enrollment transaction before reading eligibility/counts and inserting. Recheck publication, status, current grades, duplicate enrollment, capacity and session cutoff while holding the lock. Enrollment closes when the first non-cancelled session starts, even if later sessions remain. Capacity edits take the same row lock and recount before writing. Real local MariaDB integration exercises last-seat races, duplicate retries and concurrent capacity reduction.

Fix 5 pre-commit validation: 42 focused route tests and 3 real-MariaDB concurrency tests pass (including fixture cleanup). Full suite: 1,041 passes / 18 baseline failures / 6 opt-in database tests skipped. TypeScript, changed-file lint and production build pass. No schema change.

Fix 5 deployed as 334024eb3c8efe52d157bd9a068652ce7614c658, Render dep-dbmqk9mc6qcc73bdsilg, live 2026-11-06 18:24 PHT. Browser enrollment plus three duplicate requests returned [201,409,409,409], with exactly one enrollment and one tutor notification. Browser withdrawal succeeded, the class was deleted, and no page/runtime errors were found.

## Fix 6: serialize tutor scheduling

Every class/session creation, session reschedule and request-created class takes the tutor-profile row lock. Database overlap checks and writes run in the same ReadCommitted transaction. Session additions/reschedules also lock their class and validate its current state and retained session fields. Scheduled times in moderated classes remain reserved to prevent conflicts when reinstated; cancelled/completed classes release them. Real MariaDB tests cover additions across classes, reschedules, mixed add/reschedule, class creation versus addition, and suspended-class reservation.

Fix 6 pre-commit validation: 68 focused tests and 5 real-MariaDB race/reservation tests pass. Full suite 1,041 passes / 18 baseline failures / 11 opt-in database tests skipped. TypeScript, changed-file lint and production build pass.
