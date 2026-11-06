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
