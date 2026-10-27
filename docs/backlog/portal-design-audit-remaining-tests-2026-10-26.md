# Portal audit — remaining test plan

Updated: October 26, 2026 (PHT).  
Branch: `fix/portal-design-audit-2026-10-23`  
Target: https://katuwang-dev-test.onrender.com  
Source evidence: [Full audit and verification history](portal-design-audit-2026-10-23.md)

This is the focused execution checklist for **remaining verification**, after the reproduced UI defects were fixed. Historical unchecked boxes in the original audit are not new implementation work. Do not repeat completed checks unless code changes, failures, or a new environment justify it.

## Starting point

Last verified application: **`3dd0ad810dc0c3d8c402772c43a2c937e95e9fb5`**, Render deploy **`dep-dbfd0ds9v7es73db9m80`**. Documentation-only commits can be newer than the live application.

Already verified, within the scopes recorded in the full audit:

- Forty loaded pages at 355, 390, 640, and 1440px; repaired names and mobile targets, including effective settings-switch label areas.
- Password field names, hint/error associations, local mismatch validation, and native FAQ keyboard disclosure in all three portals.
- Reschedule dialog focus, Escape/backdrop/restoration, and PHT prefill in a non-PHT browser.
- Selected real-record moderation dialogs; synthetic assessment-detail retry/late-response, question Edit/Delete, and busy save-failure behavior.
- Thirteen additional admin retrieval retries plus previously tested learner/tutor retries.
- Cancelled learner classes: four response rows, four rendered links, successful Enter navigation. The earlier mismatch was a premature automation assertion.

These do **not** establish physical-device behavior, spoken announcements, persisted scheduling, every variant, or all mutation outcomes.

## Preparation and execution order

- [ ] Confirm Render workspace/service, tracked branch, live commit/deploy ID, and health before testing. Record differences from the tested checkout. Use the Render-confirmed `onrender.com` URL; the previously supplied `onerender.com` domain is unrelated.
- [ ] Prepare a disposable learner/tutor pair enrolled in the same test class, plus an authorized admin account. Keep credentials outside this document and Git.
- [ ] Prepare isolated fixtures: completed class; resumable assessment; real assessment attempt with results; editable tutor test draft; in-use/locked question; and a closable class request. Record cleanup steps and expected notifications before executing writes.
- [ ] Arrange an actual screen reader and physical iOS/Android devices. Record unavailable combinations as blocked, not passed.

Recommended order: fixtures → timezone/write round trips → missing keyboard/dialog variants → remaining failure/empty cases → screen reader → physical mobile → comparative audit.

## RT-01 — Same-record timezone and persisted round trips (DA-01)

**Needs:** disposable enrolled learner/tutor fixture, admin access, controlled writes. Use `Asia/Manila` plus `Pacific/Honolulu` or `America/New_York` browser contexts.

- [ ] Select one fixture session and record its identifier, stored instant from an authorized read, and expected PHT date/time. Include a school-midnight/day-boundary case.
- [ ] Compare that session across tutor dashboard, list, detail, editor/reschedule input and learner dashboard, timetable, class list/detail. Compare applicable admin detail/audit records; record unavailable views explicitly.
- [ ] Reschedule the fixture, save, reload, and compare all affected views in both timezones. Verify the saved instant and weekday; opening an unsaved editor is not a round trip.
- [ ] Create and edit a disposable learner request with availability slots. Verify tutor detail/acceptance prefill and the saved request/session timezone conversions where applicable.
- [ ] Verify an applicable account/event timestamp consistently across admin dashboard, list, detail and audit views using the same record.
- [ ] Restore or remove fixtures and confirm cleanup/notification outcomes.

**Pass:** school dates, times and weekdays agree across server/client views; writes preserve the intended PHT instant in both browser timezones. Test boundary inputs against actual saved records, not only helper tests. Remaining direct date arithmetic must be reviewed alongside the browser evidence.

## RT-02 — Missing keyboard/card/detail variants (DA-04)

**Needs:** fixtures that make the relevant variants visible. Wait for the correct response and rendered links after each tab/filter change.

- [ ] Activate completed learner class cards with Enter; confirm the intended detail route and back-navigation state.
- [ ] Exercise remaining suspended/banned/unpublished/full class variants that the fixture account is permitted to see, for learner and tutor as applicable. Record intentionally non-navigable states and their explanation.
- [ ] Activate a real assessment Resume link using only the keyboard; confirm attempt identity and preserved progress without submitting an assessment merely to manufacture evidence.
- [ ] Test remaining learner tutor-profile, tutor student-detail, and admin user-detail variants on mobile cards and desktop tables. Include pagination/filter/back-navigation state.
- [ ] Verify each action has a meaningful name and visible focus; separate card navigation from embedded actions without nested interactive elements.

**Pass:** every supported variant has an explicit, keyboard-usable destination/action; unavailable or forbidden variants are recorded separately. Passing one card does not complete all variants.

## RT-03 — Real-record, locked, nested and pending dialogs (DA-05)

**Needs:** real editable tutor test draft, in-use question and assessment attempt, closable request, and safe mutation fixtures. Do not infer these paths from a shared component alone.

- [ ] Open tutor **Write a question**, including its optional topic selector, in a real editable test draft. Verify all field/option names and dynamic add/remove-option behavior.
- [ ] Test in-use/locked question edit/delete restrictions, with a visible explanation and appropriate disabled behavior. Check focus when controls become disabled or disappear.
- [ ] Repeat assessment detail failure/retry and dismissal against a real attempt. Prior synthetic records did not verify the real serializer/access path.
- [ ] Exercise a real-record class-request closure dialog. Prior closure checks required a synthetic row.
- [ ] Test genuinely reachable nested/stacked dialogs: topmost ownership of Tab/Escape, background exclusion, and restoration to the correct underlying control. Record if no supported nested flow exists.
- [ ] Test safe pending/save-failure transitions and retry paths. Distinguish browser-overridden responses from actual backend mutation outcomes.

**For each dialog:** record initial focus; a full forward/reverse Tab cycle; Escape; backdrop behavior (including deliberate restrictions); focus restoration; accessible title; and disabled/busy transitions. Include spoken title/error checks in RT-05. Confirm successful write outcomes only on disposable fixtures, then clean up.

## RT-04 — Remaining loading, empty, failure and copy combinations (DA-08)

Prior broad retry coverage is complete for the named flows in the full audit. Focus here on combinations not yet covered.

- [ ] Test empty filtered results, empty initial queues, loading, and failed retrieval separately for remaining module/filter/pagination combinations. A failure must not claim the queue is empty.
- [ ] Fail admin assessment-config retrieval independently of general settings retrieval; verify which panel fails, retained state, and its recovery path.
- [ ] Verify the previously implemented subject catalog, tutor class-progress, and session-test-results recovery paths with appropriate real fixture data, not only the top-level lists.
- [ ] After changing filters/pages, verify stale rows, totals, metadata and error messages do not survive a failed fetch or successful retry. Cover independent lists on the same page.
- [ ] Verify field-level validation, mutation failure, retry, and successful confirmation on safe fixtures; distinguish these from retrieval errors.
- [ ] Continue checking remaining enum/status/role/target labels in nested forms, detail views, and less common states. Separate generated UI labels from user-authored/seeded descriptions.
- [ ] Triage over-capacity enrollment, inconsistent topics/subjects, and classes with only past scheduled sessions as data/lifecycle questions. Reproduce against controlled fixtures before changing validation or data. Do not automatically rewrite existing authored descriptions.

**Pass:** each tested state has accurate copy and an appropriate next action; supported retry succeeds without stale or contradictory UI. Browser request overrides do not establish backend outage handling or real serializer correctness.

## RT-05 — Spoken screen-reader verification (DA-02 / DA-05)

**Needs:** an actual screen reader, e.g. NVDA/Firefox or VoiceOver/Safari; record exact software versions. Accessibility-tree snapshots alone cannot complete these checks.

- [ ] Learner: browse/tutor/matching filters, requests and availability, profile/password controls, reports and progress guidance.
- [ ] Tutor: new/edit class and sessions, rescheduling, assessments/resume, question authoring and test builder, request acceptance, profile/password controls.
- [ ] Admin: filters, moderation dialogs, provisioning, settings switches and password fields, question authoring, assessment detail, reports/data tables and remaining nested forms.
- [ ] Confirm individual control names, required/invalid state, hints and field errors are spoken in a useful order. A named parent group must not substitute for an unnamed input.
- [ ] Trigger representative local validation, asynchronous failure, and retry. Confirm announcements without moving focus unexpectedly or repeatedly announcing stale errors.
- [ ] Confirm dialog titles, topmost-modal focus/background exclusion and restoration; test reading/browse mode as well as Tab.
- [ ] Confirm native FAQ question/expanded state, keyboard links and meaningful action names, including dynamic question options and switch descriptions.

**Pass:** record what was actually spoken and how it was reached, not just expected DOM attributes. Fix and retest reproducible issues before closing the relevant item.

## RT-06 — Physical mobile behavior (DA-03 / DA-07)

**Needs:** physical iPhone/Safari and Android/Chrome where available, including an actual non-PHT timezone for at least one device. Record exact device/OS/browser, viewport, zoom and orientation.

- [ ] In all portals, verify drawer initial focus, forward/reverse external-keyboard cycles, Escape where supported, close behavior, background exclusion and restoration. Do not label an unavailable key/device combination passed.
- [ ] Rotate/resize across the desktop breakpoint and return to mobile; confirm the drawer remains closed and focus stays on a visible control.
- [ ] Open the virtual keyboard in filters, password fields and reschedule inputs. Check focused fields, validation errors and primary actions remain visible/reachable.
- [ ] Test scrolling and long-content dialogs, date/time pickers, filters, cards, FAQ disclosures, pagination and settings-label touch areas by touch. Verify that switch-label taps activate the intended control only on a safe settings fixture.
- [ ] Check 355/390/wider-mobile layouts where supported; record actual device widths rather than claiming unavailable sizes. Include landscape and increased text size.

**Pass:** no clipped/unreachable primary action, trapped scrolling, obscured focused field, stale drawer state or lost restoration. Desktop viewport emulation is supporting evidence, not a physical-device pass.

## RT-07 — Complete comparative audit and closeout

- [ ] Build a per-portal route/state matrix including nested flows, mutations, assistive technology and device coverage. Link completed evidence from the full audit instead of silently repeating it.
- [ ] Repeat missing original flows on the same application commit, or explicitly identify intervening changes and carryover evidence.
- [ ] Record category scores/deltas only for inspected flows. Preserve historical overall baselines: learner **3.3**, tutor **3.3**, admin **3.2**. Do not promote scoped or DOM-only checks into an overall re-score.
- [ ] Update this file and the full audit together with pass/fail/blocked outcomes, confidence and remaining limits. Run relevant source checks if fixes are made; documentation-only edits need `git diff --check`.
- [ ] Verify cleanup, live deployment provenance and bounded health/log observations. Use a documentation-only Render skip phrase if publishing results should not trigger another application rollout.

## Evidence record — copy for each test

| Field | Required evidence |
|---|---|
| Test | RT ID and individual checkbox |
| Build | Local SHA, live SHA, Render deploy ID, target URL |
| Setup | Date/time with timezone; role; anonymized fixture ID; browser/device/reader versions; viewport |
| Steps | Exact navigation, keyboard/touch inputs and any failure override |
| Expected / actual | Observable behavior; spoken output where relevant |
| Outcome | Pass / fail / blocked / not applicable, with reason and confidence |
| Writes / cleanup | Whether responses were synthetic, what was actually saved, and cleanup result |
| Evidence | Private screenshot/log reference or sanitized excerpt; no credentials or personal record contents |

Keep boxes unchecked when evidence is missing, a fixture is absent, or the environment cannot perform the test. Record the blocker and the next concrete prerequisite instead of marking a source-inspected item complete.
