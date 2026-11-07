# Staged security and integrity verification

Completed 2026-11-07 on `fix/staged-security-integrity`, branched from the then-latest `develop` (`7d44290`). Each fix was committed, pushed, deployed to dev-test and checked in Chromium before moving on. Follow-up commits for fixes 6 and 18 were verified before the next fix.

Dev-test: https://katuwang-dev-test.onrender.com

Production was not deployed or modified. Demo passwords were preserved. Positive password/reset, recovery-email and qualification-evidence flows used isolated accounts/database where appropriate. Live QA history was archived rather than deleted.

| Fix | Commit(s) | Verification |
| --- | --- | --- |
| 1. Avatar moderation hierarchy | `4fc798a` | SUPER_ADMIN browser flow; ADMIN and protected-target regressions |
| 2. Effective class-edit scope | `3a09934` | Browser save/restore and invalid teaching scope |
| 3. Session revocation | `eb45a4f` | Isolated password flow; live stale/fresh sessions |
| 4. Current assessment access/grace | `b91a335` | Live access changes; database grace/access checks |
| 5. Capacity races | `334024e` | Live enrollment race; database capacity races |
| 6. Tutor scheduling/dialogs | `9108dbb`, `d6ef4a5` | Live overlap/reschedule and dialog submission |
| 7. Atomic request acceptance | `b029695` | Competing tutors; one class/history/notification |
| 8. Single assessment submission | `d17e718` | Browser/API race; one persisted result |
| 9. Single-use reset tokens | `327b16e` | Isolated positive/reuse/login; live invalid link |
| 10. Session history | `c99df65` | Live reopening/deletion guards; restrictive database relation |
| 11. Any-grade learner access | `fe7f1f4` | Grade 12 learner discovers/enrolls across lower grades |
| 12. Complete requested-topic coverage | `959385e` | Partial rejected, complete accepted, later removal rejected |
| 13. Shared picture prerequisites | `6e6040c` | Live setting/action matrix; original setting restored |
| 14. Verified recovery email | `1d96784` | Isolated SMTP/browser ownership flow; live guards |
| 15. Publication input | `cf10319` | Draft privacy, publication and omitted-value default |
| 16. Database-authoritative catalog | `5ce8ded` | DB-only choices, outage/retry, inactive-topic guards |
| 17. Retained enrollment history | `1675176` | Withdraw/re-enroll preserves identity, date, score and reporting |
| 18. Immutable question versions | `4711ae4`, `83d4d90` | Published content locked; corrected version preserves original tests |
| 19. Delayed PRE feedback | `7bbc713` | Both origins hidden until the same learner submits POST |
| 20. Evidenced certification approval | `c02dce1` | No-pass approval blocked; isolated manual evidence/provenance/audit |
| 21. Reviewed qualification bank | `284ba6e` | Isolated review/revocation/qualification; live demo/unreviewed guards |

## Final validation

- Standard unit/route suite: **1,160 passed**, no failures; 65 opt-in database tests skipped in that invocation.
- Opt-in isolated MariaDB suite: **65 passed** across twelve files. Reviewed-bank tests were repeated after the final seed/privacy changes.
- Focused final route/query checks: 23 passed.
- All **37 migrations** applied successfully to a fresh isolated database.
- Production build, TypeScript and changed-file lint passed.
- Final isolated and live Chromium checks reported no page errors.

Fix 19's first automatic deployment remained stuck for over four hours without logs. It was canceled and the same commit redeployed successfully; no application change was needed.

The final application commit `284ba6e` became live in Render deployment `dep-dbn77uq9lscs73bp1710`. Subsequent verification-documentation changes do not alter application code.

## Real-student readiness

**Qualified human review is still required for real qualification content.** No generic seed content was marked as qualified, and no live credential or qualified review was fabricated during QA. Demo/unreviewed content does not count toward qualification readiness. The app records competency, reviewer credentials, evidence and attestation, freezes approved versions, and rechecks eligibility before granting a new credential.

Existing credentials with unknown provenance remain explicitly labeled as legacy in administrator review. This work does not establish their validity; audit them before relying on them with real students. The distinct manual-certification alternative requires documented reason and evidence.

Detailed per-fix deployment and QA records: [staged plan](../plans/staged-security-integrity.md). Manual-check ledger: [TOTEST](../backlog/TOTEST.txt).
