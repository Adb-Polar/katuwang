# Local feature verification — 2026-10-27

Scope: requested A1/A2 global changes, learner routes, admin grade controls, and DepEd subject-grade defaults. This is not an exhaustive manual test of unrelated platform features such as email delivery or assessment authoring.

Environment: production Next.js build on localhost:3100, disposable MariaDB 11.4 database `katuwang_grade_test` on localhost:3307, dummy admin/tutor/learner accounts, and Chromium with real authenticated sessions. Remote data was not changed.

## Results

- Database: all 21 migrations recorded as applied; schema up to date.
- Production build and TypeScript: passed.
- Automated regression suite: 102 files, 743 tests passed.
- Original learner browser/API checks: 8 groups passed.
- Expanded end-to-end checks: all 14 groups passed:

1. All seven DepEd subject assignments persist.
2. Anonymous and wrong-role access is rejected.
3. Classes are filtered by subject, grade, and topic using actual database rows.
4. Auto Match includes a verified matching class and credits its dated schedule.
5. Recurring weekly preferences match the same Philippine wall-clock time as dated preferences.
6. Tutor filtering uses grade-eligible certifications; invalid grades are rejected.
7. Invalid subject grades, topic grades, weekday/date combinations, and time ranges are rejected.
8. Request creation, valid editing, reload, cancellation, and ownership checks work with persisted database rows.
9. Admin browser grade editing saves and survives reload.
10. Inactive subjects/topics disappear from the catalog and can be restored.
11. The learner request UI posts a dated request and reloads it for editing.
12. Static catalog fallback retains grade restrictions when the catalog API fails.
13. The learner dashboard removes Welcome back and places an enrolled session under its actual calendar date.
14. Dashboard, classes, tutors, match, and requests fit both 375px and 1440px widths without horizontal overflow, runtime exceptions, or server 500 responses during the test.

Class cards render no images or image enlargement controls. Earlier slot checks also verified one desktop row, responsive wrapping, and date-to-weekday synchronization.

## Bug found and fixed

Recurring preferences previously read session times in the server's local timezone while dated preferences used Asia/Manila. A 07:00 UTC session matched a dated 15:00 Philippine-time preference but received no schedule credit for the equivalent undated weekly preference. Matching and derived tutor availability now share an explicit Philippine weekday/minutes helper. Regression tests cover both ordinary times and a Philippine/UTC date boundary.

## Existing rollout limitation

The repository's older migration history omits pre-existing subject/topic tables. The local upgrade test used a reconstructed checked-in pre-change schema before applying the new migrations. The upgrade path passes; a fresh installation using only historical migrations still needs that older history reconciled. No migration history or schema was reset on a remote database.
