# Tutor portal unslop audit — 2026-11-18

Scope: every route under `src/app/tutor/`, the modals and pop-ups reachable from them, and the shared components they
render. Method: grep for the rubric's tells (`text-2xs`/`text-xs` body text, `btn-xs`/`btn-sm`, `input-sm`/`select-sm`,
`card-title`, uppercase tracking, monospace, pills/badges, dashed italic empty states, boxes in boxes), then a look in
the browser as the demo tutor. Reference: `.claude/skills/public-page-restyle/references/unslop-rubric.md`.

## Already restyled (this branch)

| Route / piece | Notes |
|---|---|
| `/tutor` dashboard | numbers line + shared `WeekDayRail` |
| `/tutor/classes` | learner-style `ClassCatalogCard`, plain empty state |
| `/tutor/classes/[id]` | decluttered header, session rows + text actions, Session tests card, Manage class menu |
| `/tutor/classes/[id]/edit` | one column, Details card, calendar session rows |
| `/tutor/classes/[id]/sessions/[sid]/test` | builder + bank / my-questions / write-a-question modals |
| `/tutor/students`, `/tutor/students/[id]` | roster rows, student page |
| `/tutor/requests`, `/[id]`, `/[id]/accept` | grouped request rows, history page, accept page shell |
| `/tutor/assessments`, `/[attemptId]` | topics / history, shared quiz components |
| `/tutor/profile`, `/tutor/profile/edit` | profile, stacked edit forms |
| `/tutor/notifications`, `/tutor/help` | restyled 2026-11-17 (all portals) |
| Notifications panel, assistant panel | portal-wide pop-ups |

## Still unstyled (found by this audit)

| Where | Tells | Severity |
|---|---|---|
| `/tutor/classes/[id]/sessions/[sid]/test/results` (`SessionTestResults`) | no `h1` (14px title), uppercase mono code kicker, "published" pill, 4 stat tiles, uppercase "PER-LEARNER GAIN", 10–12px table, ID pills, tiny "Post" button | Critical |
| `/tutor/classes/new` and the accept form body (`ClassScheduleFields`, page variant) | sans 16px bold section heads, "Subject Area" / "Topic(s)" / "Max Capacity" / "Meeting Link" title-case labels, 10px italic dashed placeholder boxes, 12px time-zone note and row labels, `badge-sm` topic chips | High |
| Grade text everywhere (`gradeLabel` / `gradeSection`) | "GRADE 8 · Rizsal" in capitals (roster, enrolled learners, selects) — raw enum with the underscore replaced | High |
| Add session / reschedule modals (`Modal`, `SessionFormFields`) | 14px bold title-case "Add a Session", fields in a bordered box inside the modal | High |
| Confirm dialogs (`ConfirmDialog`) | 14px bold title, 12px description, `btn-sm` actions | Medium |
| Class appeal card (`ClassAppealCard`, suspended classes only) | 12px text, `btn-xs` 10px buttons, `textarea-sm`, tinted box | High |
| Sidebar footer (`PortalLayout`) | "Anonymous ID" with a 10px ID pill | Medium |

Not tutor-facing (left alone): `ClassCard` (learner tutor profile, landing sample), `RecommendClassForm` (admin),
`PromptDialog` / `ActionMenu` (admin), `WeeklyTimetable` (learner tutor profile). `WeeklyScheduleView` is unused.

## Outcome

All rows in "Still unstyled" were restyled in the same change; see `Changes.md` "Tutor portal audit — remaining
pieces (2026-11-18)".
