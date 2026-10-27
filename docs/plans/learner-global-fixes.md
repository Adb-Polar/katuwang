# Global and learner fixes checklist

- [x] A1: Add grade assignments to subjects and topics, with admin creation/editing controls and shared catalog API metadata.
- [x] A1: Filter learner subject/topic choices by selected grade; clear dependent selections when grade or subject changes.
- [x] A1: Validate grade membership in learner match and request APIs; filter tutor certification eligibility by grade.
- [x] A2: Add Philippine calendar dates to shared weekly timetables, including empty schedules. Preserve rolling-window boundary dates.
- [x] A2: Keep date/day/time slot controls on one row when space permits and wrap on narrow screens.
- [x] A2: Validate, persist, retrieve, display, and match optional preferred dates. Retain undated weekly preferences.
- [x] `/learner`: Remove the Welcome back header.
- [x] `/learner/classes`: Add grade → subject → topic filtering. Verify image enlargement is absent: existing class cards render text only.
- [x] `/learner/tutors`: Replace Teaches badges with a dropdown checklist and add grade filtering.
- [x] `/learner/match`: Apply A1 using the shared criteria fields.
- [x] `/learner/requests`: Apply A1/A2, including request creation and editing.
- [x] Tutor request views: Display preferred dates and prefill the date when accepting a request.

The existing app uses plural `/learner/tutors` and `/learner/requests` routes.

## Verification

- [x] Full existing suite plus initial regression tests: 101 test files / 736 tests passed.
- [x] Additional dated-matching regression and focused rerun: 23 tests passed.
- [x] TypeScript and production build passed.
- [x] Chromium component checks with controlled catalog fixtures: filtering, selection resets, date/weekday synchronization, desktop single-row slots, 375px mobile layout without overflow, and timetable date labels.
- [x] Authenticated localhost Chromium/API checks passed against a disposable MariaDB 11.4 database: admin grade assignment APIs, catalog metadata, match/class/tutor/request filtering, dependent resets, wrong-grade rejection, date persistence, responsive request fields, and dashboard dates.

## Rollout

- [x] Add `prisma/migrations/20261027000000_catalog_grades_and_request_dates/migration.sql`.
- [ ] Apply migrations to the intended database using `pnpm exec prisma migrate deploy` before running the updated app. Local upgrade testing passed against a reconstructed pre-change schema. The remote database was not changed.
- [x] Research and assign DepEd subject-level defaults for all seven built-in JHS subjects (Grades 7–10), with a database backfill, shared fallback defaults, and seed defaults. See `docs/reference/subject-grade-mapping.md`. Applied and tested locally; remote rollout is pending.
- [ ] Review individual topic-to-grade competencies separately. Existing topics continue to obey their parent subject’s grades; no detailed topic mapping is inferred from subject coverage.
- [ ] Deploy after migration and grade configuration.

## Local database testing — 2026-10-27

- Disposable container: `katuwang-grade-test`, bound to localhost port 3307; app on localhost port 3100.
- Grade-specific fixtures are local dummy records, not curriculum assignments for production.
- All eight authenticated browser/API check groups and all 23 focused regression tests passed.
- Fresh `migrate deploy` exposed pre-existing history drift: older migrations omit the existing `subjects` and `topics` tables. To test this change, the local database was synchronized to the checked-in pre-change schema, then the new migration applied successfully. A fresh deployment still needs the earlier migration history reconciled.

## Expanded local feature verification

See `docs/plans/local-feature-verification.md`: 14 expanded authenticated browser/API groups, 743 regression tests, and the latest production build passed. Testing found and fixed inconsistent timezone handling between recurring and dated preferred slots; derived tutor availability now shares Philippine-time calculations.
