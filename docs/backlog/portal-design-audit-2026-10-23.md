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

### Fix pass progress — October 23, 2026

Branch: `fix/portal-design-audit-2026-10-23`. This section is the working checklist. The scores above are the October 22–23 baseline, before the fix pass. Implementation checks and browser checks are tracked separately below.

- [x] DA-01: Use `Asia/Manila` in shared date/time formatting, parsing, UTC serialization, weekly timetable grouping, request-slot prefill, and admin report day grouping; show PHT near schedules and time-sensitive admin records.
- [ ] DA-01: Verify the same stored session/account/event on dashboard, list, detail, editor, and audit pages in a browser running in a different timezone. Check remaining direct date arithmetic outside the shared helper.
- [x] DA-02: Associate native controls in `FormField` with labels and hints/errors, give composite fields named groups, and name learner browse/matching filters, tutor scheduling/editing controls, admin user filters, and settings toggles.
- [x] DA-02: Name administrator management search/status filters and move its account popup to the shared focus-managed `Modal`.
- [ ] DA-02: Audit remaining controls across all portal forms and verify names, hints, and errors with a screen reader.
- [x] DA-03: Enter the mobile drawer on open, trap Tab, make background inert, keep Escape, and restore trigger focus.
- [ ] DA-03: Verify focus behavior and viewport transitions in a real mobile browser.
- [x] DA-04: Use semantic links for learner/tutor class cards and admin account details.
- [ ] DA-04: Verify all card variants and user table interactions by keyboard in browser.
- [x] DA-05: Use shared focus-managed `Modal` for Manage Account and Provision Admin.
- [ ] DA-05: Verify initial focus, Escape, containment, backdrop, and restoration in browser.
- [x] DA-06: Add mobile admin account cards with identity/status/actions visible, and move Needs attention ahead of activity on mobile.
- [ ] DA-06: Inspect at 390px and confirm no duplicate visible row set, clipping, or inaccessible action.
- [x] DA-07: Put upcoming learner sessions before compact metrics on mobile, allow assessment names to wrap, and enlarge class browsing/scheduling, admin filtering, and pagination controls.
- [x] DA-07: Enlarge registration approval actions and registration/certification review filters to mobile-friendly control sizes.
- [ ] DA-07: Review tap targets and layout at multiple mobile widths, including remaining compact admin controls.
- [x] DA-08: Keep class retrieval errors separate from empty results and give no-test progress a path to enrolled classes.
- [x] DA-08: Add retry actions for learner class and progress retrieval, clear stale list errors on successful refetch, and map common assessment/account subject/status codes to readable labels.
- [x] DA-08: Separate load failure from empty queues and add retry actions in registration and certification review.
- [x] DA-08: Give admin user, administrator, and audit lists retry actions without simultaneously showing empty-result copy; show readable class subject names and audit actions/target types.
- [x] DA-08: Use the shared readable action and target labels in the admin dashboard's Recent activity list.
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
- [ ] DA-03: Test focus containment through a full Tab cycle, all three portals, and resize transitions.
- [x] DA-04, high confidence for inspected links: live learner browse cards, tutor class cards, and admin account details appeared as links in the accessibility tree.
- [ ] DA-04: Exercise every card variant and user table detail link with keyboard activation.
- [x] DA-05, high confidence for inspected dialogs: live admin Manage Account and local Provision Admin opened with focus on Close; Tab entered the form; Escape closed and restored focus. The final live administrator management dialog behaved the same after the follow-up fix.
- [ ] DA-05: Test full Tab containment, backdrop close, and assistive-technology announcements for every dialog.
- [x] DA-06, high confidence for inspected mobile layout: at 390px the live admin dashboard placed Needs attention before activity; at 390px and 355px the user cards showed identity, status, detail, and manage actions without a duplicate visible table. The 355px action buttons were stacked in the follow-up local source check to avoid wrapped labels.
- [x] DA-07, medium confidence for inspected layout: at 390px the learner dashboard put upcoming sessions before secondary metrics, and class browse filters were readable; admin user controls were readable at 355px. Other compact controls remain for inspection.
- [ ] DA-07: Inspect tutor assessment rows and remaining admin controls at 355px, 390px, and wider mobile sizes, measuring target size and clipping.
- [x] DA-08, high confidence for inspected states: live learner progress showed a distinct no-tests message and a View my classes link. The live admin audit log rendered readable action and target names. After `671b8c8`, Recent activity on the live admin dashboard displayed readable labels, including User Status Changed, Report Dismissed, Admin Created, and Topic Request Status Change.
- [ ] DA-08: Simulate request failures in all three portals to verify retry behavior and continue checking remaining raw codes and lower-priority empty states.
- [x] Follow-up deploy: `39e2430` was published to `fix/portal-design-audit-2026-10-23` and the dev-test-tracked `codex/fix-capstone-backlog` branch; Render deployed that exact commit as `dep-dbe1cg7lot8c73b9ufr0`. Health, error logs, and focused live admin controls were checked.
- [x] Admin activity deploy: `671b8c8` was published to both branches and deployed as `dep-dbe1mg0u01pc73e2hh4g`. The deploy reached `live`; health, error logs, and Recent activity labels were checked on the live dashboard.

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
