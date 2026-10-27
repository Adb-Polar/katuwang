# Katuwang portal design audit — learner, tutor, and admin

Compiled: **October 23, 2026**  
Target: https://katuwang-dev-test.onrender.com  
Preset: `saas-dashboard`

This document consolidates the learner/tutor audit of October 22 and the admin audit of October 23. It preserves their evidence, implementation references, fix checklists, and verification limits. Compilation does not constitute a new browser audit or confirmation that findings remain unchanged after those dates. The public landing-page audit is separate and is not included.

## Overall results

| Portal | Original audit score | Previous score | Verdict at audit |
|---|---:|---:|---|
| Learner | 3.3/5 | 2.7/5 | Main entry and browsing restored; accessibility and mobile task priority need work |
| Tutor | 3.3/5 | No baseline | Core read flows work; scheduling consistency and accessibility need work |
| Admin | 3.2/5 | No baseline | Clear desktop organization; significant keyboard and mobile moderation friction |

The learner improvement is **+0.6 using the displayed rounded scores**. Scores are design/usability assessments of the inspected flows, not release-readiness or security certifications.

### Combined scorecard

| Area | Learner | Tutor | Admin |
|---|---:|---:|---:|
| Visual hierarchy | 4/5 | 4/5 | 4/5 |
| Navigation | 4/5 | 4/5 | 4/5 |
| Responsive usability | 3/5 | 3/5 | 2/5 |
| Accessibility | 2/5 | 2/5 | 2/5 |
| Workflow feedback / clarity | 3/5 | 3/5 | 3/5 |
| Runtime reliability | 4/5 | 4/5 | 4/5 |

Workflow feedback/clarity groups the closely related category names used in the original reports; the original descriptions below retain their meaning. Category levels: 4 = Good, 3 = Needs work, 2 = Weak.

## Consolidated fix backlog

Shared issues are listed once here. Detailed reproduction evidence, component references, and per-portal checklists follow in the original audit sections.

| ID | Priority | Affected portals | Finding | Status at audit |
|---|---|---|---|---|
| DA-01 | High | Tutor and admin confirmed; learner shares implementation risk | Server/client timestamps differ by eight hours | Open |
| DA-02 | High | All three | Form/filter labels are not associated with controls; admin settings switches lack accessible names | Open |
| DA-03 | High | All three | Mobile drawer leaves keyboard focus on background controls | Open |
| DA-04 | High | Learner and tutor cards; admin user rows | Pointer-based navigation lacks semantic keyboard-accessible links | Open |
| DA-05 | High | Admin | Manage Account and Provision Admin dialogs lack dialog semantics and focus handling | Open |
| DA-06 | High | Admin | Mobile table hides status/actions; review queues sit below activity | Open |
| DA-07 | Medium | Learner and tutor; compact controls also affect admin | Mobile metrics, small controls, and truncated topic names weaken task clarity | Open |
| DA-08 | High for error recovery; Medium for copy | Learner; status/subject clarity also affects tutor/admin | Error and empty states need distinct handling; progress needs a next action; internal codes need readable labels | Open |

For the focused remaining verification plan after remediation, see [Remaining portal tests](portal-design-audit-remaining-tests-2026-10-26.md).

### Fix pass progress — October 23, 2026

Branch: `fix/portal-design-audit-2026-10-23`. This section is the working checklist. The scores above are the October 22–23 baseline, before the fix pass. Implementation checks and browser checks are tracked separately below.

- [x] DA-01: Use `Asia/Manila` in shared date/time formatting, parsing, UTC serialization, weekly timetable grouping, request-slot prefill, and admin report day grouping; show PHT near schedules and time-sensitive admin records.
- [ ] DA-01: Verify the same stored session/account/event on dashboard, list, detail, editor, and audit pages in a browser running in a different timezone. Check remaining direct date arithmetic outside the shared helper.
- [x] DA-02: Associate native controls in `FormField` with labels and hints/errors, give composite fields named groups, and name learner browse/matching filters, tutor scheduling/editing controls, admin user filters, and settings toggles.
- [x] DA-02: Name administrator management search/status filters and move its account popup to the shared focus-managed `Modal`.
- [ ] DA-02: Audit remaining controls across all portal forms and verify names, hints, and errors with a screen reader.
- [x] DA-03: Enter the mobile drawer on open, trap Tab, make background inert, keep Escape, and restore trigger focus.
- [x] DA-03: Close an open drawer when the viewport crosses into the desktop layout; restore focus to a visible desktop navigation link instead of the hidden mobile trigger.
- [ ] DA-03: Verify focus behavior and viewport transitions in a real mobile browser.
- [x] DA-04: Use semantic links for learner/tutor class cards and admin account details.
- [ ] DA-04: Verify all card variants and user table interactions by keyboard in browser.
- [x] DA-05: Use shared focus-managed `Modal` for Manage Account and Provision Admin.
- [x] DA-05: Verify initial focus, Escape, containment, backdrop, and restoration in browser for Manage Account and Provision Admin. Authenticated dev-test `3848324` passed full forward/reverse Tab cycles and both close/restoration paths on October 26; other variants and spoken announcements remain separately tracked.
- [x] DA-06: Add mobile admin account cards with identity/status/actions visible, and move Needs attention ahead of activity on mobile.
- [x] DA-06: Inspect at 390px and confirm no duplicate visible row set, clipping, or inaccessible action for the user cards. Authenticated October 26 checks included 355/390/640/1440px, Manage, and keyboard activation of mobile View details. See deployment evidence below.
- [x] DA-07: Put upcoming learner sessions before compact metrics on mobile, allow assessment names to wrap, and enlarge class browsing/scheduling, admin filtering, and pagination controls.
- [x] DA-07: Enlarge registration approval actions and registration/certification review filters to mobile-friendly control sizes.
- [x] DA-07: Review tap targets and layout at multiple mobile widths, including remaining compact admin controls. October 26 expanded review completed; reproduced small-target failures remain open in the unchecked-item verification pass.
- [x] DA-08: Keep class retrieval errors separate from empty results and give no-test progress a path to enrolled classes.
- [x] DA-08: Add retry actions for learner class and progress retrieval, clear stale list errors on successful refetch, and map common assessment/account subject/status codes to readable labels.
- [x] DA-08: Separate load failure from empty queues and add retry actions in registration and certification review.
- [x] DA-08: Give admin user, administrator, and audit lists retry actions without simultaneously showing empty-result copy; show readable class subject names and audit actions/target types.
- [x] DA-08: Use the shared readable action and target labels in the admin dashboard's Recent activity list.
- [x] DA-08: Give learner and admin report retrieval a retry path, keep the learner's load failure separate from the no-reports state, and render readable subject/status labels on request detail, request editing/listing, learner progress filters, and report targets.
- [x] DA-08: Render readable role, grade, subject, and status labels in admin report charts and their accessible data tables; keep long chart-axis labels compact while the full label stays in the table and tooltip.
- [x] DA-01: Use the school date, rather than UTC date, in admin report CSV filenames.
- [x] DA-02: Sweep portal JSX controls for unnamed native inputs, selects, and textareas; name the remaining admin moderation, subject/topic editing, learner renewal, and tutor editor/question-bank controls.
- [x] DA-04: Replace pointer-only tutor student rows and tutor browsing cards with semantic profile links; use a link for resuming an assessment.
- [x] DA-07: Give remaining extra-small portal buttons, selects, and inputs at least 44px of touch height below the small-screen breakpoint; keep compact desktop density.
- [x] DA-08: Show explicit retry states for tutor class/student/request lists and lower-priority admin class, appeal, abuse-report, class-request, chatbot, session-test, question-bank, and settings retrieval; separate retrieval errors from mutation errors in shared list hooks.
- [x] DA-08: Render readable subject/status names in lower-priority admin moderation, tutor request/assessment/student, and learner tutor/report surfaces.
- [x] DA-08: Add recovery for subject catalog management, tutor class progress, and session-test results retrieval instead of leaving a misleading empty state or an error without retry.
- [x] DA-05: Move the remaining admin class, registration, topic-request, question-bank, assessment-detail, and profile-picture moderation dialogs to the shared focus-managed `Modal`.
- [x] DA-06/07: Give the admin class and abuse-report queues mobile cards that keep identity, status, reason, and actions together; enlarge audit-log links for touch and replace the last raw report target type labels.
- [x] DA-08: Clear stale list totals and metadata after a failed paginated fetch, and clear stale data in the unpaginated list hook. Keep failed assessment detail requests open with a retry action and ignore responses after dismissal.
- [ ] DA-08: Review remaining internal codes and other portal empty/error states, including lower-priority admin modules.
- [x] Validation through the October 24 follow-up: `npx tsc --noEmit` passed; `npm test -- --run` passed (120 files, 931 tests); `npm run lint` passed with eight pre-existing warnings outside changed files. Focused school-time test passed (three cases).
- [x] Production build passed with `npm run build`, including the October 24 follow-up. The initial default-sandbox run on October 23 failed solely at worker port binding (`Operation not permitted`); the successful runs compiled, type-checked, and generated all pages.
- [ ] Complete a full comparative browser audit of each portal on desktop/mobile and record score deltas. The targeted checks below do not cover every original flow.

### Targeted browser verification — October 23–24, 2026

Dev test deployed commit `4cdcf86` on October 23 (`dep-dbde4cuk1f9s73f56un0`), then follow-up commits `39e2430` (`dep-dbe1cg7lot8c73b9ufr0`) and `671b8c8` (`dep-dbe1mg0u01pc73e2hh4g`) on October 24. All three reached `live`. After the latest code deploy, `/api/health` returned HTTP 200 with `healthy` and `database: connected`; Render had no error logs in the post-deploy window checked. Authenticated demo learner, tutor, and super-admin reads loaded on the first commit. The administrator filters, dialog, audit log labels, and latest admin dashboard Recent activity labels were checked on the live site.

- [x] DA-01, high confidence for inspected records: tutor C-0103 on October 29 showed 3:00 PM PHT on the live dashboard, class card, detail, and editor; the enrolled learner's class detail and weekly timetable agreed. Admin ADM-0003 creation showed October 18, 3:27 PM PHT on the live dashboard, administrator table, and audit log.
- [ ] DA-01: Repeat with a browser explicitly set to a non-PHT timezone and inspect remaining direct date arithmetic; no scheduling write/round-trip was performed.
- [x] DA-02, high confidence for inspected controls: live learner browse search/filters, admin user search/filters, and final administrator search/status filters exposed names; local admin settings switches exposed names. Tutor class editor controls inspected had named grade, location, and meeting-link fields.
- [ ] DA-02: Complete a screen-reader pass across all forms, including spoken hints and validation errors.
- [x] DA-03, high confidence for inspected menu: at a 390px mobile viewport, opening the tutor drawer focused Close, Tab moved inside it, Escape closed it, and focus returned to the menu trigger.
- [x] DA-03: Test focus containment through a full Tab cycle, all three portals, and resize transitions. Repeated October 26 on dev-test `e4f24a8` in Chromium mobile emulation; see continuation below. Physical-device verification remains open.
- [x] DA-04, high confidence for inspected links: live learner browse cards, tutor class cards, and admin account details appeared as links in the accessibility tree.
- [ ] DA-04: Exercise every card variant and user table detail link with keyboard activation.
- [x] DA-05, high confidence for inspected dialogs: live admin Manage Account and local Provision Admin opened with focus on Close; Tab entered the form; Escape closed and restored focus. The final live administrator management dialog behaved the same after the follow-up fix.
- [ ] DA-05: Test full Tab containment, backdrop close, and assistive-technology announcements for every dialog.
- [x] DA-06, high confidence for inspected mobile layout: at 390px the live admin dashboard placed Needs attention before activity; at 390px and 355px the user cards showed identity, status, detail, and manage actions without a duplicate visible table. The 355px action buttons were stacked in the follow-up local source check to avoid wrapped labels.
- [x] DA-07, medium confidence for inspected layout: at 390px the learner dashboard put upcoming sessions before secondary metrics, and class browse filters were readable; admin user controls were readable at 355px. Other compact controls remain for inspection.
- [x] DA-07: Inspect tutor assessment rows and remaining admin controls at 355px, 390px, and wider mobile sizes, measuring target size and clipping. Measured October 26 at 355/390/640/1440px; review completion does not mean every target passed.
- [x] DA-08, high confidence for inspected states: live learner progress showed a distinct no-tests message and a View my classes link. The live admin audit log rendered readable action and target names. After `671b8c8`, Recent activity on the live admin dashboard displayed readable labels, including User Status Changed, Report Dismissed, Admin Created, and Topic Request Status Change.
- [ ] DA-08: Simulate request failures in all three portals to verify retry behavior and continue checking remaining raw codes and lower-priority empty states.
- [x] Follow-up deploy: `39e2430` was published to `fix/portal-design-audit-2026-10-23` and the dev-test-tracked `codex/fix-capstone-backlog` branch; Render deployed that exact commit as `dep-dbe1cg7lot8c73b9ufr0`. Health, error logs, and focused live admin controls were checked.
- [x] Admin activity deploy: `671b8c8` was published to both branches and deployed as `dep-dbe1mg0u01pc73e2hh4g`. The deploy reached `live`; health, error logs, and Recent activity labels were checked on the live dashboard.
- [x] October 24 source follow-up: `npx tsc --noEmit`, focused ESLint, `npm test -- --run` (120 files, 931 tests), and `npm run build` passed after the report recovery and label changes. The initial build attempt hit the same sandbox-only Turbopack port-binding failure; the build with local process access completed.
- [x] Report recovery deploy: `bf5b028` reached `live` as `dep-dbe1r2flot8c73ba9260`; the authenticated admin Reports page loaded chart data and Export CSV. This live check found remaining raw chart labels, which the next source follow-up addresses. The learner report failure state and retry actions still need simulated network-failure verification.
- [x] Admin report chart deploy: `0fbf90d` was published to both branches and reached `live` as `dep-dbe1tb6k1f9s73end7k0`. Shared chart/table label formatting and compact chart-axis labels passed `npx tsc --noEmit`, focused ESLint, and `npm run build`. On the live admin Reports page, chart labels were readable and the expanded subject data table showed full names, including 21st Century Literature from the Philippines and the World. `/api/health` returned HTTP 200 with `healthy` and `database: connected`; Render had no error logs in the checked post-deploy window.
- [x] Latest source pass: `npx tsc --noEmit`, `npm run lint` (eight existing warnings outside changed files), `npm test -- --run` (120 files, 931 tests), and `npm run build` passed after the remaining control-name, semantic-link, retry-state, label, and mobile-target changes. A source AST sweep found no remaining unnamed native inputs, selects, or textareas in the three portal areas.
- [x] DA-03 resize follow-up: at 355px, the live admin drawer contained a full 24-Tab cycle and Escape restored focus to Open menu. Resizing with the drawer open through 768px to 1200px and back to 390px exposed a stale open state; the source fix now closes it at the desktop breakpoint. `npx tsc --noEmit` and focused ESLint passed; live recheck is pending.
- [x] DA-03 resize deploy: `e4f24a8` reached `live` as `dep-dbe2pdmk1f9s73eo02ng`. On the authenticated admin page, opening the drawer at 355px, resizing to 1200px, and returning to 390px left it closed; focus moved to a visible desktop navigation link at the desktop width.
- [x] DA-05/07/08 October 25 follow-up: verify mobile class and abuse-report cards, migrated admin dialogs, and assessment-detail error recovery in a browser after deployment. Completed October 26 for the named flows below on `3848324`, with authoring fixes verified through `fc906ae`; assessment-detail and class-request record overrides are explicitly identified below.
- [x] DA-01 source check: school-date tests passed under `TZ=America/New_York` and `TZ=Pacific/Honolulu` (three cases each). Remaining admin report and request-form date arithmetic starts from a PHT-derived day. A non-PHT browser check is still pending.
- [x] Latest source pass: verify the above changes in a browser, including multiple mobile widths, focus and keyboard operation, and simulated retrieval failures. See the October 26 deployment follow-up for exact flow coverage; this does not complete every variant, physical-device, or screen-reader check.

### Audit continuation — October 26, 2026

#### Deployment provenance and access

- Fetched and checked out `origin/fix/portal-design-audit-2026-10-23`, starting at **`462027c`**, with its remote upstream configured. Read `AGENTS.md`, this working checklist, and the installed Next.js server/client component and Playwright guides before changes.
- Used the authorized Render connection and the user-confirmed **My Workspace** (`tea-daief5lg1s2s73f0o9u0`). No interactive login was needed. No deployment, configuration change, moderation decision, database write, push, or seed was performed.
- **Production:** Render service `katuwang` (`srv-daiika67bikc738qdeu0`) tracks `develop`. Latest deployment **`dep-dba2126q1p3s73a0t60g`** is `live` at **`fef58af855bf6d2782d7ae1c6e60d3ec5f39c966`**. The actual Render URL is **https://katuwang.onrender.com**. Authenticated learner, tutor, and admin dashboards loaded. These older dashboards still expose historical labels/time presentation; they do **not** represent this audit branch.
- The supplied **https://katuwang.onerender.com** is a different domain: an HTTPS header request returned **302 to `http://survey-smiles.com`**. No credentials were sent there. The browser audit used only the Render-confirmed `onrender.com` domains.
- **Dev-test:** `katuwang-dev-test` (`srv-db9hg37avr4c73e3eaeg`) tracks `codex/fix-capstone-backlog`. Latest deployment **`dep-dbe2pdmk1f9s73eo02ng`** is `live` at **`e4f24a85caad79506cb01c8dbef716edf5ec7b0d`**. The audit branch is one commit ahead: `462027c` changes ten files, including mobile class/report cards, migrated moderation dialogs, detail recovery, and list-data clearing. None of those latest changes can be claimed verified on dev-test.
- Both Render-confirmed sites returned healthy, database-connected responses from `/api/health` during this session. This is a point-in-time observation.

#### Browser method and evidence boundary

Two distinct browser targets were used:

1. **Authenticated dev-test at `e4f24a8`:** headless system Chromium, `America/New_York`, desktop **1440×900** and mobile viewports **355×900, 390×900, 640×900** (drawer checks at 390×844). Waited for client retrieval to settle before recording loaded page/accessibility-tree evidence. Coverage: learner dashboard, browse, my classes, progress, requests, reports; tutor dashboard, classes, students, assessments, requests, C-0103 detail and editor; admin dashboard, users, classes, abuse reports, assessment results, settings, administrators, audit log.
2. **Local component browser harness at branch `462027c` plus this continuation's edits:** actual repository React components, hooks, and compiled application CSS, with synthetic API responses and small Next router/link/session adapters. No application authorization/server-rendering pipeline or real database was exercised. The configured cloud DB timed out (`ER_CONNECTION_TIMEOUT`); the local DB refused connection (`ECONNREFUSED`). This harness establishes browser component behavior, **not an authenticated end-to-end branch pass**. Synthetic data includes a long literature subject, long topic/reason, one scheduled class/report, and one assessment attempt.

Raw browser snapshots can include private account data and remain in session scratch storage. Do not publish them. The reproducible procedures and sanitized findings below are the durable evidence; credentials and personal record contents are omitted.

#### Latest branch checks and reproduced fixes

- [x] **DA-06/07, component browser:** admin class and abuse-report queues rendered one mobile card set and zero visible tables at **355, 390, 640px**; at **1440px**, zero visible cards and one table. No document overflow was measured. Class identity, readable subject/status, tutor, next session, enrollment, and moderation actions remained together. Report target, reason, reporter, date, and actions remained together. A 355px screenshot was visually inspected for the class card and suspension dialog.
- [x] **DA-05, component browser:** class suspension, abuse-report resolution, assessment-detail failure, registration decline, class-request closure, and profile-picture warning dialogs exposed named dialog roles. Initial focus was inside. Tested **18 forward and 18 reverse Tabs** per class/report/detail dialog at all four widths; **16 forward and 16 reverse Tabs** for the other three dialogs at 390px. Escape and backdrop click closed them; Escape restored the initiating control. No moderation action was submitted. Other variants, nested/stacked modal behavior, and spoken screen-reader announcements remain unverified.
- [x] **DA-08, component browser:** assessment detail HTTP 500 kept its modal open with a named error and Retry loading action. Retrying to a successful synthetic response rendered attempt details. Closing while a delayed response was outstanding did not reopen the dialog.
- [x] **New reproducible focus defect fixed:** after focusing Retry loading and retrying detail retrieval, that control unmounted. The next Tab escaped to the background while the dialog remained open. The shared `Modal` now restarts Tab/Shift+Tab inside when focus is outside or on the shell, skips hidden/inert candidates, and focuses the shell if none remain. The delayed-retry regression changed from **focus contained: false** before the fix to **true** after it. Normal wrap/Escape/backdrop/restoration checks still passed.
- [x] **New reproducible target-size defect fixed:** class/report/result selects and report tabs measured approximately **32px** at 355/390/640px. Added explicit minimum heights to the tested admin filters/tabs, and a portal-scoped rule for compact buttons, inputs, selects, tabs, and round icon controls below 768px. The measured filters/tabs now meet **44px**, including at 640px. The 355px suspension-dialog screenshot confirms readable duration/reason fields and enlarged actions. Desktop compact styles remain available.
- [x] **DA-08, component browser:** simulated HTTP 500 then success for admin classes, abuse reports, assessment results, learner browse/my-classes, learner progress, and tutor students. Each exposed a retry action and recovered; failures did not also show the corresponding empty-result copy. Failed admin lists displayed zero totals rather than stale totals. Assessment, class, and report failures used the actual shared hooks.
- [x] **DA-02, component browser semantics:** registration/class-request reason controls and profile-picture warning reasons exposed meaningful names. Shared `FormField` exposed the label **Reason**, associated hint **Explain the reason**, and, when invalid, `aria-invalid=true` with associated error **A reason is required**. This checks DOM/accessibility-tree semantics, not speech output.
- [x] **DA-04, component browser keyboard:** focused learner browse and my-class card links and tutor student detail links, pressed Enter, and waited for the expected destination URL. Covers those variants only; every class status, assessment-resume link, and every detail-link variant remains pending.

#### Authenticated dev-test checks at the older commit

- [x] **DA-03:** all three portal drawers contained **35 forward Tabs**, Escape restored Open menu, resizing open drawers to 1440px closed them, and returning to 390px left them closed. Browser viewport emulation is not an iOS/Android device test.
- [x] **DA-01, non-PHT browser, inspected records:** with browser timezone explicitly `America/New_York`, C-0103's October 29 session showed **3:00 PM PHT** on the tutor dashboard/timetable and **3:00 PM** in detail and editor session summaries. The loaded class list also exposed the corresponding PHT-formatted schedule. No reschedule dialog was saved, and no serialization/write round trip was performed. ADM-0003 creation agreed at **October 18, 3:27 PM** in administrator management and its matching audit event; the dashboard used the same PHT time. Learner dashboard/timetable exposed PHT-labelled times, but a same-record learner detail/editor comparison remains pending.
- [x] **DA-04:** Enter activated the tutor dashboard session link to C-0103 and an admin View account details link to its expected user detail route.
- [x] **DA-06/07:** inspected loaded learner, tutor, and admin pages at all four widths without document-wide overflow. Admin users exposed mobile cards at narrow widths and a desktop table; dev-test classes/abuse reports still used the older scrolling tables, as expected from deployment provenance. Learner progress had a distinct no-tests message plus View my classes. All tested pages finished loading without captured uncaught browser errors.
- **Remaining copy/data observations:** dev-test still displays `CLASS`/`TUTOR` report target badges and some legacy subject codes in assessment choices. Those views predate the branch's readable-label changes, so these are not new branch regressions. Seeded free-text descriptions include enum-like words and inconsistent academic topics; automatic replacement of authored text was not attempted. Some active classes have only past scheduled sessions; this needs lifecycle/data review rather than assuming a browser failure. The empty assessment-results queue prevented a real-record detail check, so the latest detail/error scenarios used synthetic data.

#### Comparative scores for inspected flows only

Original overall scores **learner 3.3, tutor 3.3, admin 3.2 remain historical baselines**. Do not substitute this table for a full overall re-score. These conservative category comparisons apply to the authenticated `e4f24a8` read flows named above, with component harness evidence listed separately. They do not score uninspected writes, all forms, speech output, physical mobile behavior, or the undeployed branch as a whole.

| Portal / category | Historical category | Inspected-flow assessment | Delta | Basis and limit |
|---|---:|---:|---:|---|
| Learner / accessibility | 2 | 3 | +1 | Named browse filters, semantic links, full drawer cycle/resize; full screen-reader/form pass pending |
| Learner / workflow clarity | 3 | 4 | +1 | Loaded browse/my-classes, PHT schedule labels, no-tests next action; source retry behavior separately exercised with synthetic failures |
| Tutor / accessibility | 2 | 3 | +1 | Named roster/editor controls, semantic session navigation, full drawer behavior; not every card/form tested |
| Tutor / workflow clarity | 3 | 4 | +1 | C-0103 consistent in non-PHT browser dashboard/detail/editor, readable status and named editor fields; no scheduling write round trip |
| Admin / accessibility | 2 | 3 | +1 | Named settings/filters, keyboard detail link, full drawer behavior; latest moderation dialog evidence is component-only |
| Admin / responsive usability | 2 | 3 | +1 | User cards preserve account context and dashboard queue priority; older deployed class/report tables still require contained scrolling |

Other categories are **not re-scored**. A complete, same-commit, end-to-end comparative audit remains unchecked.

#### Validation after this continuation's fixes

- [x] `npx tsc --noEmit` passed.
- [x] `npm run lint` passed with the same **eight existing warnings** in seed/test files and no errors.
- [x] `npm test` passed: **120 files, 931 tests**.
- [x] `npm run build` passed with compilation, type checking, and page generation, using local process/network access needed by the managed sandbox.
- [x] `git diff --check` passed. The final component browser pass retained successful containment/close/restoration checks at all four widths, the delayed-retry focus regression passed, and measured target filters/tabs had no sub-44px targets at 355/390/640px.

#### Remaining verification limits

- [x] Deploy and authenticate the current branch, then repeat the named latest class/report cards, moderation dialogs, and detail retry cases. Subsequently completed after user authorization on October 26; see the deployment follow-up. Synthetic-record limits and remaining variants are tracked separately.
- [ ] Use an actual screen reader to confirm spoken names, hints, dynamic errors, dialog titles, and modal background exclusion across all forms. Accessibility-tree evidence does not complete this item.
- [ ] Repeat on physical mobile browsers, including reverse drawer focus cycles and real virtual-keyboard behavior.
- [ ] Complete same-record learner timezone coverage, reschedule/new-request round trips, every card/detail/resume variant, all lower-priority modules and their empty/error states, and the complete original comparative scope before changing overall scores.
- [ ] Verify remaining Edit/Delete, locked/busy, nested-dialog, and pending/disabled-control transitions. Admin Add question and the other named dialog flows were subsequently browser-verified; shared tutor authoring and every variant are not inferred from those checks.

### Dev-test deployment follow-up — October 26, 2026

The user subsequently authorized pushing this branch and deploying it, then clarified that dev-test must track **`fix/portal-design-audit-2026-10-23` directly**. The branch's tested application changes were committed as **`38483245b5ed421c72d3ebb19fdc965d1430f4ce`** and pushed. The initial push also fast-forwarded the formerly tracked `codex/fix-capstone-backlog` branch; after the clarification, Render's dev-test branch was changed to the requested audit branch, retaining automatic deploys on commit. Production's branch and deployment were not changed.

Render service `srv-db9hg37avr4c73e3eaeg` confirms `branch: fix/portal-design-audit-2026-10-23`, `autoDeploy: yes`, and `autoDeployTrigger: commit`. A deployment initiated after this configuration change, **`dep-dbfbu3ijnfac738qhuq0`**, reached **`live` at 02:49:03 UTC / 10:49:03 PHT**, serving exact commit **`3848324`** at https://katuwang-dev-test.onrender.com. The earlier automatic build from the initial push is not the deployment used for the checks below.

This supersedes the earlier continuation's statement that no deployment had yet been requested. Browser results from the earlier `e4f24a8` audit remain historical; follow-up browser evidence is tied to `3848324`.

#### Authenticated browser results on deployed `3848324`

- **Read coverage:** learner dashboard/classes/my classes/progress/requests/reports; tutor dashboard/classes/students/assessments/requests; admin dashboard/users/classes/abuse reports/registrations/assessment results/settings/administrators/audit log/reports. All inspected loaded reads avoided document-wide overflow at **355, 390, 640, and 1440px**. Tests ran in Chromium with timezone `America/New_York`.
- **Latest mobile cards verified end to end:** admin classes and abuse reports each showed **10 visible cards, zero visible tables** at 355/390/640px, and **zero visible cards, one visible table** at 1440px. Measured visible mobile buttons, selects, inputs, and tabs had no targets below 44px. Inspected real-record suspension and report-resolution dialogs at every width with **24 forward and 24 reverse Tabs**, initial focus, Escape/restoration, and backdrop close/restoration. No moderation decision was submitted.
- **More real-record dialogs:** registration decline, administrator provisioning, account management, profile-picture warning, and both Resolve/Dismiss question-request dialogs passed those focus/close checks. Enter activated the mobile admin View details link. Class-request closure used a synthetic API row because the live list did not expose a closable request; its deployed dialog passed, but a real-record closure check remains pending.
- **Retrieval recovery:** browser-side HTTP 500 overrides followed by retry against the real API passed for learner classes/progress/reports, tutor students/requests, and admin classes/abuse reports/registrations/assessment results. Error and relevant empty-state copy stayed distinct. These overrides did not induce server or database outages. Two initial automation selectors were corrected (Retry reports versus Retry loading, and mobile View details versus desktop View account details); the corrected checks passed.
- **Assessment detail:** the real queue had no attempt rows. A browser-only synthetic attempt row/detail response exercised the deployed authenticated page: HTTP 500 retained an error dialog, Retry loaded details, Tab stayed inside after the retry control unmounted, Escape restored View, and a late response after dismissal did not reopen the modal. The app's server authorization and real attempt serializer were not covered by the synthetic record.
- **Shared navigation/time:** all three drawers passed **35 forward plus 35 reverse Tabs**, Escape/restoration, desktop resize closure, and closed state on return to mobile. Learner Enter activated a browse card. Tutor Enter activated C-0103; dashboard, detail, and editor agreed on October 29 **3:00 PM** in the non-PHT browser. No scheduling change was saved.
- **One additional defect reproduced:** opening the actual admin **Add question** popup exposed **zero dialog roles**, left focus outside, and remained open after Escape. This was reproduced in a second targeted live browser check, rather than inferred solely from source. `QuestionFormModal`, shared with tutor test authoring, still used a bespoke shell. It now uses the shared named, focus-managed `Modal` while preserving its body, form state, and submission behavior. The previously tested question-request/detail/delete shells did not cover this authoring component.
- After this additional fix, **TypeScript, lint (eight existing warnings), all 120 test files / 931 tests, production build, and `git diff --check` passed**. Live re-verification of the authoring fix is tracked in the next deployment note.
- The post-`3848324` deployment window queried contained **no Render error-level logs**. `/api/health` checks and final deployment evidence are repeated after the follow-up rollout.

#### Authoring-dialog deployment and label follow-up

The shared authoring-shell fix was pushed only to the directly tracked audit branch as **`ef212d6046bcac21360f7749be424f94d2c03841`**. Automatic deployment **`dep-dbfc48s9v7es73dajgd0`** reached **`live` at 03:02:10 UTC / 11:02:10 PHT**. Its real admin Add question dialog then passed named role, initial focus, 24 forward/reverse Tabs, Escape/restoration, and backdrop close/restoration. There were no captured uncaught browser errors in this check.

The same deployed browser check found that the eight answer radio/text controls lacked explicit individual labels (the text boxes relied on placeholders). The follow-up adds **Mark option N as correct**, **Option N text**, and contextual **Remove option N** names. This fixes an authoring component outside the portal-directory source sweep; that earlier sweep must not be read as a guarantee covering all shared components. Spoken screen-reader output remains unverified.

#### Final live verification — `fc906ae`

- [x] Pushed **`fc906aeb9adbb9e475437001f4be64ff2fe60a60`** to `fix/portal-design-audit-2026-10-23`. Automatic deploy **`dep-dbfc6rc9v7es73dall10`** reached **`live` at 03:07:35 UTC / 11:07:35 PHT**. Render confirmed that dev-test directly tracks this audit branch with auto-deploy on commit. Production was not deployed.
- [x] Final authenticated browser run: **13 checks passed, zero failed**, using real deployed application code in Chromium / `America/New_York`. Repeated all three dashboard reads at 355/390/640/1440px; the Add question dialog at each width; real class/report cards and dialog behavior at 355px; and assessment detail failure/retry/late-dismissal behavior. Earlier broader read and retry checks at `3848324` remain tied to that commit; the subsequent runtime diff is confined to the shared question-authoring component.
- [x] **Add question, all four widths:** named dialog and all ten input/textarea controls; four distinct correct-answer radio names and four option-text names; contextual removal names; adding/removing an option preserved correct names; 24 forward and 24 reverse Tabs; initial focus; Escape/restoration; backdrop close/restoration; no outer or internal dialog horizontal overflow. No question was submitted or saved. The shared tutor authoring path was not exercised with a real editable draft and remains a distinct coverage limit.
- [x] **Regression:** real mobile class/report cards still passed, and the synthetic assessment detail retained its error dialog, recovered on retry, contained Tab during the delayed retry, restored View on Escape, and ignored a response after dismissal. The synthetic-attempt serializer/server-access limits still apply.
- [x] `/api/health` returned **HTTP 200**, **healthy**, **database: connected** at **03:08:55 UTC**. The Render error-level log query from **03:07:35 through 03:10:19 UTC** returned **zero entries**. No uncaught browser errors were captured in the final three portal contexts. These are bounded observations, not a long-term reliability claim.
- [x] Latest source validation: **TypeScript passed; lint passed with eight existing warnings; 120 test files / 931 tests passed; production build passed; `git diff --check` passed**.

The verification documentation is committed with a Render skip phrase so recording the results does not trigger another application rollout. The live application commit is `fc906ae`; a later documentation-only branch tip does not indicate a different tested runtime. Historical overall scores remain unchanged. Physical mobile browsers, spoken screen-reader announcements, every mutation outcome, all modal/link variants, and remaining lower-priority modules are still outside the completed coverage.

### Unchecked-item verification pass — October 26, 2026

Target: **https://katuwang-dev-test.onrender.com**, Render live application **`fc906ae`**, deployment **`dep-dbfc6rc9v7es73dall10`**. Repository tip `6356303` differs only by verification documentation. This pass tests the remaining working checklist and its verification summary; the unchecked boxes in the original October 22–23 reports remain historical baselines, not a second implementation backlog.

**Method:** authenticated headless Chromium with browser timezone **Pacific/Honolulu**; 355×900, 390×900, 640×900, 1440×900 viewports. Browser DOM/accessibility-tree measurements, keyboard activation, synthetic retrieval failures, and synthetic question rows were used. No backend write, schedule change, question save/delete, account change, or assessment submission was performed. API writes other than login were blocked; the busy-state test fulfilled its attempted question POST entirely inside the browser. No application code was changed in this pass.

#### Coverage and outcomes

- **40 loaded page captures:** learner dashboard, browse, my classes, tutors, progress, matching, requests, reports, profile editing, notifications, help; tutor dashboard, classes, new class, students, requests, assessments, profile editing, notifications, help; admin dashboard, users, registrations, classes, class requests, appeals, abuse reports, notifications, audit log, chatbot, reports, question bank, question requests, assessment results, certifications, session tests, subjects, settings, administrators, help. No document-wide horizontal overflow was measured on these pages at any of the four widths. A successful capture is not a pass for all controls on that page.
- **13 additional admin HTTP-500/retry checks recovered to real API data:** accounts, class requests, appeals, audit log, chatbot misses, reports, question-bank coverage, question requests, certifications, session tests, subject management, settings, administrators. Together with the preceding deployed learner/tutor tests, all three portals now have simulated retrieval-recovery evidence. Each check observed the retry action and successful recovery; it did not exhaust every filter, pagination, empty/error-copy combination or independent assessment-config fetch. The first accounts selector expected the wrong Retry caption; it was corrected to accept the actual Retry accounts button. Interrupted automation captures were rerun; they are not application failures.
- **Keyboard variants:** Enter navigated learner browse cards, upcoming enrolled-class cards, tutor profile cards, tutor active and history class cards, and tutor student detail links. The completed learner queue had zero records. The cancelled tab advertised four records but the sweep exposed no matching class-detail link; this needs a dedicated count/filter/content check rather than assuming that variant passed. Assessment-resume links and every moderated/unpublished variant were not established by these samples.
- **Question Edit/Delete dialogs:** browser-only synthetic question row with `inUse=false`; both named dialogs passed initial focus, 24 forward/reverse Tabs, Escape/restoration, backdrop close/restoration. A delayed browser-only HTTP-500 save response kept Add question open, showed the save error, and contained focus through 12 Tabs while controls were busy. No real question was saved or deleted. In-use/locked variants, nested dialogs, real tutor editable drafts, and all pending-control transitions remain unverified.
- **Honolulu reschedule check:** C-0103's October 29 session opened with **date 2026-10-29 and time 15:00**, agreeing with the earlier dashboard/list/detail/editor PHT evidence. The dialog inputs exposed Session date and Session time names. No save was performed. The initial semantic-dialog test failed; a second DOM-based check confirmed the separate accessibility defect below.

#### Reproduced failures — keep remediation items open

1. **DA-05: Tutor reschedule popup lacks dialog semantics and Escape close.** On `/tutor/classes/[C-0103 id]/edit`, activate the second Reschedule session action. The visible popup exposes **zero dialog roles** and **remains open after Escape**. Correct timezone prefill does not make this a successful modal check. Source location for remediation: `src/components/tutor/SessionActions.tsx` (bespoke reschedule shell). Its full focus/restoration behavior is not certified by the passing shared-Modal tests.
2. **DA-02: Unnamed password controls.** Learner and tutor profile editors, and admin Settings → My Account, each expose **two unnamed textboxes**. In admin Settings the accessibility tree places those controls within Current password and New password groups but leaves the textboxes themselves unnamed; Confirm new password is named. Naming a parent group does not establish an individual textbox name. These findings are from the live accessibility tree, not only a source sweep.
3. **DA-02: Unnamed FAQ checkbox controls.** Help pages expose unnamed accordion checkbox inputs: **12 learner, 10 tutor, 10 admin**. Test spoken semantics and keyboard disclosure behavior before deciding the replacement pattern; this pass establishes the missing checkbox names.
4. **DA-07: The project’s 44px mobile target goal is not met across all surfaces.** At 355px the learner tutor-subject filter buttons measure approximately **20px high**; learner matching selects/action and profile-editor controls approximately **40px**; browse/my-class search approximately **42px**; dashboard quick links approximately **32px**, timetable links approximately **42px**. Tutor assessment controls inspected at 355 and 640px had no measured sub-44px targets, but other pages still expose compact links. Admin class cards have 44px primary actions while repeated code/name links and some other controls remain smaller. These are target-height measurements, not a complete WCAG spacing/contrast evaluation. No document-wide overflow does not imply adequate tap targets.
5. **DA-08 / data clarity:** a learner class description still contains `ARALING_PANLIPUNAN` in seeded free text. It is not the mapped subject heading. Some records show enrollment over capacity or inconsistent subjects/topics. Treat these as fixture/data-quality findings until validated separately; do not automatically rewrite authored descriptions or infer a system-label regression.

#### Disposition of the previously unchecked groups

| Group | This pass | Why the broader box remains open |
|---|---|---|
| DA-01 same-record/non-PHT/round trip | Honolulu browser verified reschedule prefill; direct arithmetic review corroborates the existing PHT-derived school-date path | No persisted reschedule/new-request round trip or complete same-record learner/dashboard/detail/editor/audit chain |
| DA-02 names/hints/errors with screen reader | Live name audit found the password/FAQ gaps above; existing field hint/error semantics remain scoped evidence | No actual screen-reader speech output; not every dynamic validation path exercised |
| DA-03 real mobile focus/viewport | Prior desktop Chromium mobile emulation remains valid | No physical iOS/Android connection; no `adb` available; emulation cannot complete this item |
| DA-04 all cards/details/resume | Five keyboard flow sets exercised, including active/history and tutor profiles | Empty completed queue, cancelled-link observation, no real resume attempt, not every status variant |
| DA-05 every dialog/AT/busy/nested | Edit/Delete and simulated busy save failure tested; tutor reschedule failed | Remaining nested/locked/tutor-draft variants and spoken dialog announcements |
| DA-07 remaining tap/layout review | Forty pages measured at four widths, including tutor assessments | Review completed, but the reproduced small targets mean usability is not resolved |
| DA-08 lower-priority codes/empty/errors | Thirteen admin failures recovered; normal page/empty states inspected | Not every API/filter/empty/error combination; seeded text and inconsistent records remain |
| Full comparative audit/summary | Expanded desktop/mobile read coverage across all three portals, with concrete new failures | Not full original nested/mutation/assistive-technology scope; no unsupported overall re-score |

**Scores:** retain the historical overall scores and the previously recorded scoped category deltas. This pass supports keeping responsive usability/accessibility at **Needs work (3/5)** for the inspected flows; it does not justify an additional improvement delta. Visual hierarchy and full workflow outcomes were not re-scored from DOM measurements.

**Environment limits:** no actual screen reader (`orca` not installed) or physical device interface was available. These blocks cannot be marked complete using source inspection, accessibility-tree snapshots, or mobile viewport emulation. No scheduling write was used merely to manufacture missing fixture coverage. A controlled writable fixture and actual assistive-technology/device access are needed to finish those cases.

- [x] Every remaining working-checklist group has an explicit tested/failed/unavailable disposition above.
- [x] Repair and recheck the reproduced tutor reschedule, password/FAQ naming, and mobile-target failures. Completed in the remediation deployments through `3dd0ad8`; see measured, scoped results below. Actual screen-reader/device verification remains separate.
- [x] Resolve the cancelled learner queue/link observation: waiting for the actual response produced four rows and four links; Enter opened a detail page. No API patch was needed.
- [ ] Provide fixtures for completed/resume/locked/nested/tutor-draft cases.
- [ ] Complete actual screen-reader, physical-mobile, and persisted scheduling/request round-trip checks.

Validation: this pass changes documentation only. `git diff --check` passed; source build/type/lint/931-test validation remains the preceding `fc906ae` evidence, not a newly rerun suite. Raw snapshots containing personal records remain in session scratch storage and are excluded from Git.

### Remediation of the expanded-audit findings — October 26, 2026

- Tutor rescheduling now uses the shared named `Modal`, including initial focus, full Tab wrapping, Escape, backdrop close, and restoration. The old body portal and bespoke shell were removed; PHT parsing/serialization and save behavior remain intact.
- Shared password controls now have individual Current password / New password names, contextual show/hide names, and an associated new-password hint. The client-side mismatch error is associated with the confirmation field and marks it invalid.
- Help uses native `details`/`summary` disclosures instead of unnamed checkbox controls; disclosure state and keyboard interaction can now be exposed natively.
- Mobile minimum target height now covers portal buttons, disclosure summaries, selects, text/date/password inputs, and main-content links, including custom filter badges and controls that lacked DaisyUI compact classes. Subject-filter badges can wrap rather than clip long labels. Checkbox/radio inputs retain their own control sizing; native disclosure semantics replace the FAQ checkbox targets.
- The cancelled-list observation was rechecked against the actual network response: HTTP 200, total **4**, returned rows **4**, rendered class-detail links **4**. The earlier zero-link capture occurred before retrieval settled. No API/data change is warranted; browser checks must wait for the cancelled response and rendered links before asserting counts or activating a card.

Source validation: TypeScript, lint (eight existing warnings), all **120 files / 931 tests**, production build, and `git diff --check` passed. Deployed verification is recorded separately after rollout; these implementation notes do not complete physical-device or spoken screen-reader checks. Existing seeded descriptions and inconsistent capacity/topic fixtures are not automatically rewritten.

#### First remediation deployment verification

`f62bdc15b69e6d59b34b7518117e5c98252442f0` reached live as `dep-dbfcmiqjnfac73ekm5jg` at **03:41:16 UTC / 11:41:16 PHT**.

- **14 targeted checks passed, zero failed:** password names and local mismatch validation in all three portals; native FAQ Enter/Space behavior in all three; reschedule named-dialog focus/24 forward and reverse Tabs/Escape/backdrop/restoration at 355/390/640/1440px; and four cancelled cards with successful Enter navigation. PHT date/time prefill remained 2026-10-29 / 15:00 in the Honolulu browser.
- A further admin check followed `aria-describedby` to the actual hint/error elements and verified the expected text. No password change was sent to the server.
- Repeated **40 page captures at four widths**: no document-wide overflow and no unnamed controls in the measured role categories. This remains accessibility-tree evidence, not spoken screen-reader verification.
- The broader sizing rule fixed the initially reproduced learner targets, but **640px** still exposed compact buttons/links in appeals, abuse-report audit links, question requests, certifications, and session-test results. `sm:min-h-0` utility precedence over the component CSS was the cause. The mobile target rule is moved outside the component layer so the explicit below-768px size requirement takes precedence over compact utility classes. Final deployed checks follow below.
- Health returned healthy / database connected, and the error-log window checked after rollout was empty.

#### Final remediation rollout — `f119457`

Automatic deployment **`dep-dbfcr3rbc2fs7392hjfg`** reached **live at 03:51:04 UTC / 11:51:04 PHT**, serving **`f119457af7bca34d3d01fa04ceb307c1a92442db`** from `fix/portal-design-audit-2026-10-23`.

- **14 final targeted checks passed, zero failed** on this deployment: named password fields, actual hint/error descriptions and invalid confirmation state, native FAQ Enter/Space disclosure behavior in all three portals; reschedule modal semantics, 24 forward/reverse Tabs, Escape/backdrop/restoration and PHT prefill at all four widths; cancelled-tab network count and Enter navigation. Browser timezone was Pacific/Honolulu. No password or schedule update was submitted.
- The cancelled-tab observation is resolved as an automation timing issue: waiting for the cancelled response and rendered cards gives four rows, four links, and a successful detail navigation. No backend query/data patch was made.
- The reschedule dialog, password/FAQ names, and individual mobile size findings in the preceding failure report describe the pre-fix deployment; the new implementation and its subsequent deployed checks supersede those findings. Physical-device, spoken screen-reader, nested/locked/fixture-only, and real scheduling-write checks remain separate limits.

#### Final sizing sweep and settings switch hit areas

On `f119457`, the **40-page / four-width sweep completed** with no document-wide overflow or unnamed controls in the audited role categories. The previously failing 640px appeals, audit links, question requests, certifications, and test-results actions now meet the measured target height. The final **14 behavioral checks also passed** on this deployment, including actual password hint/error descriptions in all three portals.

The remaining small input measurements were the **nine named settings switches**, whose native input drawing is 24px high. Each switch now sits inside an associated, padded, minimum-44px clickable label. This enlarges the effective hit area while preserving the switch appearance and disabled behavior. Final browser checks measure the associated label, rather than incorrectly equating the native switch drawing with its entire clickable area. No settings changes are submitted by these checks.

#### Remediation complete for the reproduced browser failures

Final application commit **`3dd0ad810dc0c3d8c402772c43a2c937e95e9fb5`**, automatic deploy **`dep-dbfd0ds9v7es73db9m80`**, reached **live at 04:02:16 UTC / 12:02:16 PHT** on https://katuwang-dev-test.onrender.com. Dev-test continues tracking `fix/portal-design-audit-2026-10-23` directly. Production was not deployed.

- Final switch verification: **six checks passed, zero failed** (admin dashboard smoke check, four viewport switch-area checks, and no uncaught browser errors). All **nine switches** have explicit names and native associated labels measuring at least **56×44 CSS pixels** at **355, 390, 640, and 1440px**. No setting was toggled or saved.
- The preceding **40-page / four-width** pass on `f119457` found no document-wide overflow and no unnamed controls in the audited role categories. Its only remaining small native-input drawings were those nine settings switches; the final label-area checks resolve their effective touch targets. Other measured mobile buttons, links, text inputs, selects and filter badges met the 44px height goal, including the previously failing 640px admin actions. This does not claim a universal contrast/spacing or every-popup audit.
- **14 behavioral checks passed** on `f119457`: all-portal password names/hints/mismatch errors, native FAQ keyboard behavior, reschedule semantics/full focus cycles/Escape/backdrop/restoration with PHT prefill at all four widths, and cancelled-class count/keyboard navigation. The only runtime change from that commit to `3dd0ad8` is the settings-label wrapper, tested separately above.
- Validation after the settings-wrapper change: **TypeScript passed; lint passed with eight existing warnings; all 120 files / 931 tests passed; production build passed; `git diff --check` passed**.
- Post-rollout health reported healthy / database connected; the checked Render error-level log window was empty. These are point-in-time observations.

The reproduced UI defects are fixed and their browser remediation checkbox is complete. Physical iOS/Android testing, spoken screen-reader verification, unavailable fixture variants and persisted scheduling round trips remain unchecked. Seeded free-text descriptions/capacity/topic inconsistencies were not rewritten as part of these UI fixes. Documentation-only verification updates use a Render skip phrase; the live application commit remains `3dd0ad8`.

### Recommended implementation order

1. **DA-01:** standardize display timezone, calendar grouping, and input round trips; verify identical records across server/client views.
2. **DA-02–DA-05:** repair shared field semantics, navigation links, drawer focus, and admin dialog handling.
3. **DA-06–DA-08:** improve mobile task priority and action visibility, control sizing, readable labels, and recovery/empty-state guidance.

### Verification checklist

- [ ] Same session/event shows consistent dates and times on dashboard, list, detail, edit, and audit views.
- [ ] Fields, filters, and switches expose meaningful accessible names and associated hints/errors.
- [ ] Keyboard users can navigate class cards and user details through semantic links.
- [ ] Dialogs and mobile menus move focus inside, contain it, close appropriately, and restore focus.
- [ ] At mobile widths, primary actions remain discoverable with identity/status context visible.
- [ ] Empty, loading, and error states are distinct and offer appropriate next actions.
- [ ] Repeat each portal's inspected flows on desktop/mobile and record fix status, confidence, and score deltas.

## Resolved runtime blocker

The missing `topic_requests.expiresAt` column previously broke the learner dashboard and class browsing. The deployed database repair applied `20261019000000_topic_request_expiry_history` and reconciled the already-present profile-picture migration. All 160 existing requests were preserved, request dates were backfilled, and 160 baseline history records were created.

Subsequent live checks confirmed the learner dashboard loads, Browse Classes returns 35 results, and My Requests loads. **These failures are resolved and must not be treated as open fixes.** The underlying error/empty-state presentation defect remains open in the reviewed implementation.

## Reading the detailed audits

The following sections contain the original findings with their original audit dates. Counts and timestamps are observations from those sessions, not continuously updated metrics. Local source paths refer to repository files; source line numbers may move as code changes. Screenshots remain in ignored local scratchpad storage and are not required to understand this document. Credentials, personal record contents, and database backups are excluded.

## Learner and tutor portal design audit — October 22, 2026

Target: https://katuwang-dev-test.onrender.com  
Preset: `saas-dashboard`  
Learner: **3.3/5**, previously **2.7/5** (+0.6 on rounded scores).  
Tutor: **3.3/5**, first audit; no previous tutor baseline.

### Scope

Live browser inspection used the authorized demo learner and tutor accounts after the database repair. Desktop used the normal browser viewport (approximately 1280px). Mobile testing requested 390px and observed content viewports of 355–390px during captures. Local implementation was inspected to substantiate semantics and timezone behavior. Deployed source is the previously verified `codex/fix-capstone-backlog` commit `1eb9f30`; no code edits or new deploys were performed for this audit.

Learner coverage: repaired dashboard, class browsing, mobile navigation and keyboard behavior, filter semantics and class-card semantics. The recent same-session repair checks and prior re-audit provide supporting evidence for requests, class details, matching, and progress; these were not all freshly repeated after switching accounts in this audit.

Tutor coverage: dashboard, class list, C-0103 details and editor, new-class form with local topic/session-row interactions, assessment topics/history, requests, and mobile navigation. No class was created, saved, rescheduled, deleted, or completed; no request was accepted, no questions requested, and no assessment started or submitted. Test-taking, live grading, mutations, delivery services, and long-term performance are outside this verification.

### Verdict

The database repair restored the learner's main entry and discovery flows. Both portals have coherent styling and understandable navigation, but shared accessibility defects and a confirmed timezone mismatch prevent production-level confidence. The tutor interface supports its tasks well visually; scheduling information must become consistent before relying on it for real sessions.

### Scorecard and learner delta

| Area | Learner before | Learner now | Tutor | Priority |
|---|---:|---:|---:|---|
| Visual hierarchy | 4 | 4 | 4 | Medium |
| Navigation | 4 | 4 | 4 | Low |
| Responsive usability | 3 | 3 | 3 | Medium |
| Accessibility | 2 | 2 | 2 | High |
| Error, empty, and workflow feedback | 2 | 3 | 3 | High |
| Runtime reliability | 1 | 4 | 4 | High |

Scores use whole numbers for categories and arithmetic means for overall scores. The baseline category was named “Error and recovery states”; this audit includes related workflow feedback in that same category for the tutor assessment and scheduling surfaces. Level meanings: 4 = Good, 3 = Needs work, 2 = Weak. Runtime 4 reflects successful inspected reads, not complete end-to-end validation or a performance benchmark.

### Learner fix verification

| Previous issue | Status | Confidence |
|---|---|---|
| Dashboard fails after sign-in | Fixed | High |
| Browse Classes fails to load | Fixed | High |
| Failed retrieval also shown as an empty catalog | Still open in implementation | High |
| Missing accessible labels | Still open | High |
| Pointer-only class-card navigation | Still open | High |
| Progress empty state lacks a next action | Still open in reviewed implementation | High |

Verification notes:

- The learner dashboard shows 14 enrolled classes, 11 sessions this week, and 0 open requests. Class browsing returns 35 classes with no retrieval error and no captured browser console errors.
- Repairing the request schema fixed the live failure, but `ClassBrowser.tsx` still renders its empty state when `classes.length === 0` without excluding a request error. A future outage would still produce the contradictory messages.
- Subject/grade filters have no associated labels or aria-labels; inspected browse controls measure 12px text and 32px height.
- Inspected class cards are pointer-styled divs without a role or tabindex. The shared local ClassCard implementation uses a div with `onClick` for these callers rather than a semantic link.
- Progress implementation still provides no next action for the no-tests state; this issue was observed live in the preceding audit and repair session.

### Category notes

#### Scheduling and workflow feedback — 3/5, High

What works: Tutor sessions, class details, and edit actions are grouped clearly.

What hurts: The same session displays different times depending on the page; assessment history also exposes raw status and subject codes.

Fix: Adopt an explicit school timezone for display and day grouping, label it, and map internal enums to readable text.

#### Accessibility — 2/5, High

What works: Navigation links expose current-page state; topic checkboxes and session date/time/duration controls have useful names.

What hurts: Main form selects are unlabeled, class navigation uses click-only containers, and mobile menu focus stays outside the modal drawer.

Fix: Associate labels/hints, use semantic links, and implement menu focus entry, containment, restoration, and background inertness.

#### Responsive usability — 3/5, Medium

What works: Checked mobile screens fit without horizontal document overflow; scheduling rows wrap and menu navigation works by pointer.

What hurts: Stacked learner metric cards push upcoming sessions down, dense assessment rows truncate topic names, and compact controls reduce readability and tap comfort.

Fix: Put the next session first on mobile, condense metrics, allow meaningful topic names to wrap, and increase key control sizes.

### Top issues and recommended fixes

#### 1. High — Make session times consistent across pages

**Live reproduction:** Tutor C-0103, “Retorika at Pampublikong Pagsasalita,” October 29:

- Tutor dashboard: **07:00 AM**.
- Tutor class detail: **7:00 AM**.
- Tutor class list: **3:00 PM**.
- Tutor class editor: **3:00 PM**.

The November 1 session likewise displays 8:00 AM on server-rendered views and 4:00 PM in the editor. The observed eight-hour offset matches UTC versus Asia/Manila. `src/lib/datetime.ts` uses runtime-local formatting without a `timeZone`, while server and client consumers reuse these helpers. The learner portal shares the same helpers and is exposed to the same implementation risk; this audit's same-session page-to-page reproduction was on the tutor account.

- [ ] Define a single display timezone, such as `Asia/Manila`, for the school's sessions.
- [ ] Apply it to dates, times, weekdays, and timetable grouping, not just the displayed hour.
- [ ] Show a clear timezone label near schedules and input instructions.
- [ ] Keep UTC storage and local input conversion behavior explicit and verify round trips across server and browser.
- [ ] Verify the same session agrees on dashboard, card, detail, edit, and learner-facing views.

Relevant files: `src/lib/datetime.ts:38`, `src/components/classes/SessionsList.tsx:45`, `src/components/schedule/WeeklyTimetable.tsx:41`, `src/app/learner/page.tsx`, and `src/app/tutor/page.tsx`.

#### 2. High — Repair form, class-card, and mobile drawer accessibility

**Live evidence:** Tutor new-class subject, grade, capacity, description, and location controls have zero associated labels. Learner filters have the same issue. While the learner mobile menu is open, pressing Tab from its trigger focuses the background Help & FAQs link rather than entering the drawer. The modal declares `aria-modal` but its background remains keyboard reachable.

- [ ] Add stable IDs and `htmlFor` associations to shared fields and their consumers.
- [ ] Connect hints/errors with `aria-describedby`; expose invalid fields with `aria-invalid`.
- [ ] Use real links for card navigation, preserving any separate avatar/button controls without nesting interactive elements.
- [ ] Move focus inside the mobile menu, keep Tab navigation inside it, make background content inert, and restore focus on close.
- [ ] Preserve the existing Escape-to-close behavior.

Relevant files: `src/components/ui/FormField.tsx:46`, `src/components/classes/ClassCard.tsx:197`, `src/components/learner/ClassBrowser.tsx:126`, `src/components/tutor/ClassScheduleFields.tsx:60`, and `src/components/layout/PortalLayout.tsx:105` / `:304`.

#### 3. Medium — Improve mobile task priority and status clarity

**Live evidence:** Three full-width learner metric cards precede upcoming sessions. Tutor assessment topic names truncate on mobile, while actions take a large portion of each row. Assessment content exposes `SHS_21ST_CENT_LIT`, and history uses `SCHEDULED` beside verified certifications. Tutor primary creation controls use 14px text and 40px height; session date/time controls are 32px high. Learner browse controls are smaller still.

- [ ] Prioritize the next session and its date/time above secondary metrics on mobile.
- [ ] Increase key form text toward 16px and touch-control height toward 44px, with enough target spacing.
- [ ] Let assessment topic names wrap; separate or stack the action when necessary.
- [ ] Replace subject/status enum strings with readable labels and explanations of assessment prerequisites.
- [ ] Give progress empty states a clear explanation and a link to the relevant class/session.
- [ ] Separate empty, loading, and failed-request states, with retry where appropriate.

Relevant files: `src/app/learner/page.tsx:109`, `src/components/tutor/TopicCertificationList.tsx`, `src/components/tutor/AssessmentHistory.tsx`, `src/components/tutor/ClassScheduleFields.tsx:88`, `src/components/learner/MyProgressView.tsx:128`, and `src/components/learner/ClassBrowser.tsx:158`.

### Next fix pass

Quick wins:

- Repair shared field associations and display labels for subject/status codes.
- Stop showing empty-catalog copy after a request error; add recovery actions and useful progress guidance.

Medium work:

- Standardize schedule formatting and weekday grouping across server/client contexts, verifying the same session end to end.
- Replace pointer-only class navigation and add proper mobile menu focus management.
- Reorder mobile dashboard content and adjust dense assessment rows/control sizing.

### Evidence and limits

Local evidence: `learner-desktop.jpg`, `learner-mobile.jpg`, `tutor-desktop.jpg`, `tutor-mobile.jpg`, `tutor-edit-desktop.jpg`, `tutor-editor-times.jpg`, `tutor-create-mobile.jpg`, and `tutor-assessments-mobile.jpg`.

Demo data includes mismatched subjects/topics and historical sessions still marked scheduled. These observations warrant fixture review but do not establish that all corresponding production validation paths are broken. No comprehensive contrast measurement, screen-reader session, quiz submission, or destructive interaction was performed. The mobile focus and card/label findings are grounded in live DOM behavior plus matching source inspection.

Credentials and private database backup data are omitted. The source report and screenshots are stored in ignored local scratchpad storage; this compilation is under docs/backlog.

## Admin portal design audit — October 23, 2026

Target: https://katuwang-dev-test.onrender.com  
Preset: `saas-dashboard`  
Overall: **3.2/5 — functional and visually coherent, with significant accessibility and mobile workflow friction.**

This is the first formal admin design audit in this conversation. Learner/tutor scores are not an admin baseline, so no score delta is claimed.

### Scope and method

Authenticated with the authorized super-admin demo account. Inspected dashboard, learner/tutor user management, a Manage Account dialog, registration approvals, reports and an expanded chart data table, platform settings, administrator management and its creation dialog, and the audit log. Desktop viewport was set to 1440×900; mobile to 390×844. Local source was inspected for concrete implementation references.

Interactions were limited to sign-in, navigation, search, opening/closing dialogs, expanding navigation groups and a report data table, and keyboard focus checks. No approvals, declines, bans, suspensions, account creation, configuration changes, password changes, exports, or database changes were performed. Authoritative action outcomes, security policy correctness, and all assessment/moderation submodules were not tested.

### Scorecard

| Area | Score | Level | Priority |
|---|---:|---|---|
| Visual hierarchy | 4/5 | Good | Medium |
| Navigation | 4/5 | Good | Low |
| Responsive usability | 2/5 | Weak | High |
| Interaction and workflow clarity | 3/5 | Needs work | High |
| Accessibility | 2/5 | Weak | High |
| Runtime reliability | 4/5 | Good | Medium |

Overall is the arithmetic mean of these six category scores, rounded to one decimal. Successful read flows do not establish that every admin action or error path works.

### Category notes

#### Accessibility — 2/5, High

What works: Navigation identifies the current page; assessment setting number inputs have accessible names; reports offer data tables.

What hurts: Management filters and nine settings toggles lack accessible names, user rows require pointer clicks for detail navigation, and bespoke moderation/account-creation dialogs omit focus handling and dialog semantics.

Fix: Associate labels and controls, provide explicit detail links, and reuse the existing shared Modal component with appropriate focus behavior.

#### Responsive usability — 2/5, High

What works: Pages avoid document-wide horizontal overflow at 390px; the user table uses a contained scrolling region.

What hurts: Status and Manage are offscreen in the user table, and urgent review queues appear below the activity log on mobile.

Fix: Present compact mobile account cards or keep identity/status/actions visible, and move Needs attention ahead of Recent activity at narrow widths.

#### Workflow clarity — 3/5, High

What works: Dashboard counts link to review queues, settings descriptions explain effects, and the provisioning form explains the standard-admin role and activation process.

What hurts: Timestamps differ by eight hours between server-rendered and client-rendered views, while raw action/status strings and generic Save labels require interpretation.

Fix: Apply an explicit display timezone and label it; use readable action names and contextual confirmation copy.

### Top issues and recommended fixes

#### 1. High — Repair semantics and keyboard handling in high-impact controls

Observed evidence:

- User-management status and grade filters have zero associated labels and no aria-label; search relies on placeholder text.
- All nine inspected general/assessment setting toggles have no associated label, aria-label, or aria-labelledby. Visible paragraphs explain the settings but do not name their controls for assistive technology.
- The Manage Account popup is a div with no role=dialog or aria-modal. Focus remains on the background Manage trigger, and Escape leaves it open.
- The Provision Admin Account popup likewise lacks dialog semantics and leaves focus on the background creation trigger.
- Opening the mobile navigation menu and pressing Tab from the trigger focuses the background Help & FAQs link rather than entering the drawer.
- User detail navigation is implemented on table-row onClick without a keyboard-focusable detail link.

Fix checklist:

- [ ] Add stable IDs and explicit labels to filter, form, and settings controls; associate descriptions/errors separately.
- [ ] Reuse the shared Modal for account management and administrator provisioning, with accessible titles, named close controls, initial focus, focus containment, Escape handling, and restoration.
- [ ] Correct the shared portal drawer's focus management and make background content inert while it is open.
- [ ] Provide a semantic link to each user's detail page; retain a separate contextual Manage button.
- [ ] Verify keyboard-only use of search, filter, user detail, moderation dialog, settings, and menu flows.

Relevant source:

- `src/components/admin/UserManagementTable.tsx:155` — unnamed search/filter controls.
- `src/components/admin/UserManagementTable.tsx:205` — pointer-only row navigation.
- `src/components/admin/UserManagementTable.tsx:276` — bespoke account popup.
- `src/components/admin/PlatformSettingsForm.tsx:227` — visible descriptions and unlabeled toggles.
- `src/components/admin/CreateAdminModal.tsx:111` — bespoke provisioning popup.
- `src/components/layout/PortalLayout.tsx:304` — shared mobile drawer.
- `src/components/ui/Modal.tsx:17` — existing shared modal implementation available for reuse.

#### 2. High — Keep review decisions visible and readable on mobile

Observed evidence:

- At a 390px viewport, the filtered user table is approximately **623px wide inside a 306px container**. Identity is visible first; Status and Manage require horizontal scrolling.
- User filters measure **12px text and 32px height**; pagination controls are smaller.
- The mobile dashboard places the Needs attention heading around **1185px** from the document top, beyond an **844px** viewport and after eight activity records. The dashboard has two pending registrations, 66 pending certifications, and one pending class appeal, so this queue is operationally important.
- The user page repeats its title as both the page heading and section heading, spending space before the task controls.

Fix checklist:

- [ ] Use mobile account cards, prioritized columns, or sticky action/status columns so review does not require losing identity context.
- [ ] Make row actions explicit and contextual, rather than relying on horizontally hidden generic Manage buttons.
- [ ] Move Needs attention before activity on mobile, or show a compact actionable queue summary near the top.
- [ ] Increase key filter/input text toward 16px and tap targets toward 44px while retaining efficient desktop density.
- [ ] Remove redundant headings where they do not establish useful hierarchy.

Relevant source: `src/components/admin/UserManagementTable.tsx:191`, `src/components/admin/RegistrationApprovalTable.tsx`, and `src/app/admin/page.tsx:90` / `:126`.

#### 3. High — Standardize timestamps across admin surfaces

Observed evidence:

- The dashboard's ADMIN CREATED event for ADM-0003 shows **October 18, 7:27 AM**.
- The administrator management table shows that account's Created value as **October 18, 3:27 PM**.
- The eight-hour offset repeats the server/browser discrepancy observed in the learner/tutor audit. `formatDateTime` follows the runtime locale/timezone without an explicit timeZone. Dashboard formatting happens on the server while administrator-table formatting happens on the client.

Fix checklist:

- [ ] Adopt an explicit school display timezone, such as Asia/Manila, throughout audit events, creation timestamps, suspension expiry, and schedule displays.
- [ ] Show the timezone near time-sensitive records or date-range controls.
- [ ] Keep stored timestamps unchanged; correct presentation and grouping consistently.
- [ ] Verify one event/account shows the same timestamp on dashboard, audit log, administrator table, and detail views.
- [ ] Map internal action/status/subject values to readable labels where practical.

Relevant source: `src/lib/datetime.ts:38`, `src/app/admin/page.tsx:110`, and `src/components/admin/AdminManagementTable.tsx:259`.

### What worked

- Dashboard counts and review queue links loaded successfully.
- User search narrowed results to the known demo learner.
- Registration approvals showed two pending rows with clearly separated Approve and Decline controls; neither was invoked.
- Reports loaded summary counts and charts; expanding Show data table exposed a real table.
- Assessment number settings include accessible names and explanatory text, providing a useful pattern for other controls.
- The super-admin account is labeled System Protected in administrator management; this is an observed UI state, not a full authorization test.
- The audit log populated 25 rows without a retrieval error.
- No browser console warnings/errors were captured during the inspected admin flows.

### Evidence and limits

Local screenshots: `dashboard-desktop.jpg`, `dashboard-mobile.jpg`, `manage-account.jpg`, `users-mobile.jpg`, `reports-mobile.jpg`, and `settings-desktop.jpg`.

Screenshots can contain administrative account information and must stay local unless explicitly shared. Credentials are omitted from this report. Full contrast ratios, screen-reader announcements, authenticated write outcomes, every queue's empty/error behavior, and destructive/security-sensitive operations were not tested. The source report and screenshots are in ignored local scratchpad storage; no application source changes were made during the audit.
