# Capstone backlog fixes — 2026-10-22

Branch: `codex/fix-capstone-backlog`.

All three items in `docs/backlog/TODO.txt` are implemented and have passed the checks below. This follow-up supersedes the original audit's status for BUG-001, BUG-002 and BUG-009 only. It does not establish overall capstone readiness or close the other audit findings.

## Changes

**BUG-001 — inactive-account authorization:** `getActiveServerSession()` is now the application server boundary. It reads the current database account on every call, rejects inactive/deleted accounts and mismatched roles, and refreshes grade/avatar fields. All 115 existing server consumers (APIs, pages, admin guards and upload middleware) migrated to this boundary; raw NextAuth server-session reads remain only inside the boundary itself. Database failures fail closed. JWT role refresh no longer adopts a changed role into an existing login. Existing inactive/deleted accounts lose permission on their next protected server request; role changes require signing in again. Expired suspensions are reinstated by the existing login flow, so affected users must sign in again. Provider upload callbacks separately recheck current account status, role and avatar lock before changing the profile.

**BUG-002 — certification answer keys:** tutors may browse/attach shared BANK questions only within their current CERTIFIED subject/topic scopes. Search parameters cannot widen those scopes. Uncertified tutors receive an empty bank response without querying question rows. Legacy linked questions and session-test result/builder paths also enforce current certification. Own custom-question authoring remains available. Tutor certification reviews retain score/selected-answer feedback but withhold full keys and explanations. Learner diagnostic reviews also withhold shared BANK keys/explanations to avoid an alternate download path; custom-question review and authorized admin review retain their intended behavior. Both quiz interfaces correctly display feedback without requiring full keys. This limits unrestricted answer-key access; it is not a claim that collusion, repeated guesses or educational testing validity have been solved.

**BUG-009 — production route types:** the admin-list GET handler now requires a `NextRequest`, and tests supply it. Query filtering, sorting and pagination are preserved and tested. Production-generated route checks and the full production build now pass without bypassing validation.

No migrations, schema changes, seeds, account changes or shared/production database writes were performed. The original audit remains a dated baseline. Its reproduction test source now checks secure behavior for BUG-001/002; the unrelated whitespace-validation probe still records BUG-005, which was not part of the three-item backlog.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Full Vitest suite, `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | 119 files, **928 tests passed**, exit 0 | [tests.log](evidence/tests.log) |
| Account-boundary regressions | 26 tests passed; all four roles, inactive statuses, deletion, role changes, DB outage and direct API denial | [account-authorization.log](evidence/account-authorization.log) |
| `pnpm build` | **Passed**, including production TypeScript and route generation | [build.log](evidence/build.log) |
| Post-build `node node_modules/typescript/bin/tsc --noEmit --incremental false` | **Passed**, exit 0 | [typecheck.log](evidence/typecheck.log) |
| `pnpm lint` | **0 errors, 8 existing warnings**, exit 0 | [lint.log](evidence/lint.log) |
| Production HTTP smoke | **9/9 passed** | [http-smoke.json](evidence/http-smoke.json) |
| Diff whitespace check | Passed | `git diff --check` |

Build and smoke used a deliberately unreachable loopback QA database URL, preventing shared/cloud data access. The compiler required local process/port permissions outside the default sandbox. The temporary production server ran on loopback port 4317 with a synthetic auth secret and was stopped after testing.

HTTP smoke covered login=200, admin-list/tutor-bank/notifications/avatar APIs=401 without a session, production dev API=404, and all three protected portals redirecting through the framework sign-in endpoint to the custom login page. The first smoke assertion expected a direct login redirect; inspection showed the legitimate intermediate NextAuth sign-in redirect, and the final test verifies the full chain. No application change was needed for that expectation correction.

Authenticated moderation/role/qualification behavior was exercised using isolated mocked accounts and database responses. Full authenticated browser workflows, real MariaDB persistence/concurrency, actual SMTP/UploadThing delivery and broader academic release gates remain unverified. One authoritative account read per protected server call and certification-scope reads add database work; no performance benchmark is claimed.

Evidence logs and CSV exports use normalized line endings and trimmed terminal whitespace for version control; substantive command output is preserved.
