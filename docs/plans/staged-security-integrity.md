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

Fix 6 backend commit 9108dbb13de7f66203ad2addbf036d6bb3b9a68a deployed via dep-dbmsgvpsrm7s73buaqeg (live 2026-11-06 20:33 PHT). Live overlapping additions were serialized, but browser rescheduling exposed a pre-existing nested-form submission bug: the dialog submitted the parent class form and closed without a session PATCH. A follow-up isolates the reschedule form in a body portal and stops modal submit propagation, including Add Session's existing portal. Two focused UI regressions cover single-session submission and validation without parent submission. Do not advance to Fix 7 until the corrected browser flow passes. Render log retrieval temporarily returned 503 during this check.

Scheduling UI follow-up pre-commit checks: 2 new focused UI regressions pass. Full suite 1,043 passes / 18 baseline failures / 11 opt-in DB tests skipped. TypeScript, changed-file lint and production build pass.

Fix 6 corrected UI deployed as d6ef4a5fdfce5a4cbc655d3a69890358c6062f25, Render dep-dbmsm55ckfvc7390dt90, live 2026-11-06 20:44 PHT. Live browser: overlapping additions [201,409], reschedule 200 with Manila time persisted, Add Session 201, zero parent-class PATCH submissions, conflicting move 409, three sessions persisted, and no page errors. Disposable class deleted.

## Fix 7: atomic eligible request acceptance

Take the request row lock, recheck current tutor grade/certifications, then conditionally claim the eligible OPEN, unexpired, unchanged request before class creation. Create class, fulfill link, history and notification in that same transaction. Losing claims return 409 and write no class. Learner edits/renewals/cancellation share the request lock and guarded lifecycle conditions so queued stale writes cannot modify accepted requests. Four real-MariaDB tests cover competing tutors, transaction rollback, expiry and a stale learner edit arriving after acceptance. Updated the learner-edit test's outdated topic fixture to the current grade-appropriate catalog name.

Fix 7 pre-commit validation: 23 focused request tests and 4 real-MariaDB integration tests pass. Full suite 1,047 passes / 17 baseline failures / 15 opt-in DB tests skipped. The touched learner-edit catalog fixture correction resolves one baseline failure. TypeScript, changed-file lint and production build pass.

Fix 7 deployed as b0296958b65c0e2f09e7ce5917865bfffe11d992, Render dep-dbmsu6navr4c739590gg, live 2026-11-06 21:01 PHT. Live two-tutor browser/API race returned [201,409], one class, one accepted link and one learner notification; repeated acceptance returned 409. Learner browser showed coverage. History count verified in real DB integration (no history-read endpoint). QA request retained cancelled with explicit QA note; class removed. No browser page errors.

## Fix 8: one winning assessment submission

Learner session tests and tutor qualification quizzes conditionally transition IN_PROGRESS attempts inside the transaction before any item grades, notifications or certification changes. Losers get 409. Learner access is checked again through the same transaction client after claiming, so restrictions changed while waiting roll the claim back. Tutor certification updates serialize on the tutor profile and re-read the existing badge. Five real-MariaDB tests cover competing scores, notification uniqueness, existing certification, concurrent pass/fail attempts and withdrawal-triggered rollback.

Fix 8 pre-commit checks: 40 focused submission/access tests and 5 real-MariaDB integration tests pass. Full suite 1,050 passes / 17 baseline failures / 20 opt-in DB tests skipped. TypeScript, changed-file lint and production build pass. No schema change.

Fix 8 deployed as d17e7185be4537e11198589dbb603119f081ae29, Render dep-dbmt5dgu01pc739guv6g, live 2026-11-06 21:17 PHT. Browser plus three API submissions returned [200,409,409,409]. Stored score/answer matched the winning response, one tutor notification was emitted, reload showed a read-only finalized attempt, and repeat submission returned 409. Fixtures cleaned; no page or error-level runtime logs.

## Fix 9: single-use reset tokens

Hash outside the transaction, lock the token row, then conditionally consume only an unused and currently unexpired token. Read the clock after acquiring the lock. Password hash and session-version update commit in the same transaction; losing or expired claims return the existing generic invalid-link response without a user write. Real MariaDB tests race four different passwords and expire a token after the initial lookup. Positive browser reset QA remains isolated, preserving seeded passwords as requested.

Fix 9 pre-commit validation: 7 focused tests and 5 real-MariaDB reset/session-version tests pass. Full suite 1,051 passes / 17 baseline failures / 22 opt-in tests skipped. TypeScript, changed-file lint and production build pass. Isolated Chromium reset succeeded, reused token returned 400, old session returned 401, fresh login succeeded, and session version increased once; no page errors. Seeded dev-test passwords unchanged.

Fix 9 deployed as 327b16ec1fd5615ee20695d3268f99e6d90a4dc6, Render dep-dbmtbc0n74is73bfoco0, live 2026-11-06 21:29 PHT. Live Chromium invalid reset returned 400 and generic error with no page errors. Positive reset/reuse/session invalidation verified in isolation as authorized.

## Fix 10: retain session assessment history

Completed sessions cannot be reopened or have their schedule/topic rewritten. Session/class deletion checks current assessment records under class locks; cancel instead. A restrictive session-test foreign key prevents cascading assessment deletion even when test creation races with deletion.

Fix 10 pre-commit validation: 53 focused route tests and 2 real-MariaDB retention/race tests pass. Full suite 1,057 passes / 17 baseline failures / 24 opt-in tests skipped. TypeScript, changed-file lint and production build pass. Migration applied successfully to isolated MariaDB.

Fix 10 deployed as c99df6597d764b0a97cac5e2b8cf8ae795c04bfb, Render dep-dbmtf2vf3r2c73aqs01g, live 2026-11-06 21:37 PHT. Live browser: completed reopen/rewrite 409, class deletion 409, session delete dialog 409 with preservation message, cancellation 200 and test retained. No page errors. QA class cmw50sbfn00003sdqoqvue6f1 retained unpublished/cancelled.

## Fix 11: shared any-grade learner access

Use one unrestricted grade policy for class/tutor discovery, enrollment, profiles and request pools. Keep explicit grade filters, class-topic/target validity and relevance ranking.

Fix 11 pre-commit validation: all 142 focused grade/discovery/request/enrollment/search/chatbot/match tests pass (137 routes/policy plus 5 match tests). Full suite 1,108 passes / 11 remaining baseline failures / 24 opt-in tests skipped. Corrected canonical catalog fixtures in touched request/match tests resolve six baseline failures. TypeScript, changed-file lint and production build pass. Auto Match grade is a relevance signal and does not narrow topic validation or its picker.

Fix 11 deployed as fe7f1f4a6a08daf59e403ef90c8d97bb87aa655b, Render dep-dbmtjuon74is73bg3pig, live 2026-11-06 21:47 PHT. Grade 12 browser saw Grade 10 tutor / Grade 9 class, request action, cross-grade Auto Match and enrollment 201; chatbot 200. No page errors. Temporary class withdrawn/deleted.

## Fix 12: complete requested-topic coverage

Acceptance requires all requested topics, rechecked from the locked snapshot. Tutors missing requested certifications cannot open a partial acceptance form. Learner request cards display actual linked class topics.

Fix 12 pre-commit validation: 51 focused route/coverage tests and 5 real-MariaDB acceptance tests pass. Full suite 1,112 passes / 11 baseline failures / 25 opt-in tests skipped. TypeScript, changed-file lint and production build pass. Also prevent later linked-class edits from removing promised coverage.

Fix 12 deployed as 959385e2d085644f38c760bf2e048299b8c09157, Render dep-dbmtntuc6qcc73bi3i5g, live 2026-11-06 21:56 PHT. Live two-topic request: partial 400 leaves OPEN, complete 201, later removal 400, actual class coverage visible in learner request card. No page errors. QA requests cancelled/classes deleted. Browser assertion corrected to open the existing Past tab for accepted requests and ignore topic ordering.

## Fix 13: shared avatar action prerequisites

One backend policy governs tutor publication/request acceptance and learner enrollment. Optional and tutor-only/all-user setting modes retain their scope. Setting wording names the actions precisely.

Fix 13 pre-commit validation: 94 focused policy/route tests and 8 real-MariaDB enrollment/acceptance tests pass. Full suite 1,124 passes / 11 baseline failures / 25 opt-in tests skipped. TypeScript, changed-file lint and production build pass.

Fix 13 deployed as 6e6040cf2e233d533c832524b36b29aeaa508283, Render dep-dbmtsj8n74is73bggrr0, live 2026-11-06 22:07 PHT. Live admin setting UI saved 200; missing-avatar tutor create/publish/accept and learner enrollment returned 400; learner profile remained accessible; OPTIONAL enrollment 201. No page errors. Original setting restored and QA fixtures cleaned.

## Fix 14: verified recovery email

Persist normalized backup addresses for registration and both profile roles. Require the current password to change a backup address; clear ownership on change. Profile controls save, send a short-lived code and verify ownership. Conditional token consumption and current-address matching reject reuse, expiry and address changes. Password recovery queries only verified backup addresses and rejects ambiguous matches without issuing tokens or sending mail.

Fix 14 pre-commit validation: 34 focused profile/registration/forgot-password tests and 6 real-MariaDB verification tests pass. Full suite 1,127 passes / 11 baseline failures / 31 opt-in tests skipped. TypeScript, changed-file lint and production build pass. Isolated Chromium and local SMTP: save/reload, reject unverified backup, deliver code, verify, reject reuse, deliver password-reset link to verified backup and clear verification on address change all pass with no page errors or external mail.

Fix 14 deployed as 1d9678420a6ee3175b44cf43f486a2abf94c9170, Render dep-dbn1ja17lnhs73dcp6ig, live 2026-11-07 02:19 PHT. Live Chromium profile/registration controls visible, invalid code/address 400, four unauthenticated checks 401, seeded recovery state unchanged, no mail sent or page errors.

## Fix 15: honor class publication input

Persist the submitted boolean on creation; omitted values explicitly default true. Avatar publication prerequisites apply to published classes while drafts can be saved without a picture.

Fix 15 pre-commit validation: 28 focused creation tests pass. Full suite 1,131 passes / 11 baseline failures / 31 opt-in tests skipped. TypeScript, changed-file lint and production build pass. No schema change.

Fix 15 deployed as cf10319bd78df448791c0d2d0065064e7332f1f2, Render dep-dbn1meh42hec73alnjhg, live 2026-11-07 02:26 PHT. Live browser: draft persisted false; hidden from Browse/Search/Match; direct view 404; enrollment 400; tutor menu publish 200 makes class visible. Omitted publication defaults true. No page errors; fixtures deleted.

## Fix 16: database-authoritative runtime catalog

Remove static fallback validation and picker choices. Coverage, question-bank navigation, chatbot extraction and dev sampling use active DB subjects/topics. Catalog failures become retryable 503 responses and never authorize a write using static data.

Fix 16 pre-commit validation: full suite 1,146 passes / 31 opt-in tests skipped / zero failures. Ten real-MariaDB scheduling/acceptance checks pass. TypeScript, changed-file lint and final production build pass; focused picker retry also passes after the final React lint correction. Explicit DB fixtures and current canonical topics replace fallback-dependent test assumptions; login-focus mock now uses the current INCORRECT_PASSWORD contract. Server outage test proves retryable 503 before any question write.

Fix 16 deployed as 5ce8dedab502c317dac1943a824dbbc3a57493bb, Render dep-dbn1tvks728c73cuf5lg, live 2026-11-07 02:42 PHT. Browser/API: DB-only subject/topic appears in catalog, coverage, chatbot and bank UI; custom question creation 201; failed picker fetch exposes no static choices and retry recovers; inactive topic hidden and write 400. No page errors; QA question/topic/subject removed.

## Fix 17: retained enrollment history

Withdrawal timestamps the enrollment instead of deleting it. Enrollment/withdrawal share the class lock; re-enrollment reactivates the retained row. Active counts, rosters, notifications and assessment access exclude withdrawals. Historical progress, report eligibility and results keep the original relationship and scores.

Fix 17 pre-commit validation: full suite 1,149 passes / 35 opt-in tests skipped / zero failures. Seven real-MariaDB history/capacity tests pass, including retained scores/reporting, assessment rejection, stable re-enrollment ID/date, duplicate withdrawal serialization and capacity with retained rows. TypeScript, changed-file lint and production build pass. Migration applied successfully to isolated MariaDB. Deletion guards continue to protect all enrollment history; progress/report queries retain historical relationships.

Fix 17 deployed as 1675176eabdcfa4808151b35cc61ae57bc03ef3c, Render dep-dbn25aff3r2c73d6nqag, live 2026-11-07 02:58 PHT. Browser withdrawal 200 preserves score100, timestamp, withdrawn progress choice, report action and historical cohort1 while current roster0 and attempt access403. Browser re-enrollment201 preserves enrollment ID/date and score. No page errors. QA class cmw5c8bf500003sffjo8dkhnc retained cancelled/unpublished.

## Fix 18: immutable published question versions

Publication and qualification starts lock selected question rows and record immutable-use timestamps. Content edits and retirement serialize with those writers; retired questions cannot enter new tests/attempts. Test question replacement and draft deletion serialize with publication. Admin corrections create an audited successor version and retire the original, preserving linked tests, options and scores.

Fix 18 pre-commit validation: 37 focused route tests; full suite 1,150 passes / 45 opt-in tests skipped / zero failures. Ten real-MariaDB version/immutability cases pass, including first-publication locking, corrected-version preserved grading, concurrent successors, retirement during selection, stale BANK/TUTOR edits and draft replacement/deletion after publication. TypeScript, changed-file lint and production build pass. Final malformed-body guard is covered by the DB route test and repeat type/lint checks. Migration backfills existing published/attempted question locks.

Fix 18 follow-up: a successor also freezes an unpublished original. The ten MariaDB version tests, six focused route tests, TypeScript and changed-file lint pass.

Fix 18 deployed as 83d4d90bfa29262edb15bd4d09f7a36b2dbd6260, Render dep-dbn2hbgae00c739ijvmg, live 2026-11-07 03:23 PHT. Browser: published edit/delete409 before attempts, Edit disabled, corrected version201, lineage/original options/test links preserved, future selection uses successor and excludes retired versions. No page errors; class cmw5d5cw900003tg2ew2u5jh1 retained cancelled/unpublished and QA versions retired.

## Fix 19: withhold PRE answer feedback until POST submission

Use one learner feedback policy on submission and reload: submitted POST unlocks keys for the same learner/test only. Withhold options, per-item grades and explanations for both origins until then; retain aggregate scores and neutral selected-answer UI. Staff review remains available.

Fix 19 pre-commit validation: full suite 1,155 passes / 46 opt-in skipped / zero failures. Eleven real-MariaDB checks pass, including mixed-origin PRE submission/reload, another learner POST, own in-progress POST, final POST feedback and unlocked PRE review. TypeScript, changed-file lint and production build pass. No schema change.
