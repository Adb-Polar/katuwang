# Migration: `tutorclass_references_tutorprofile`

## Why

`TutorClass.tutorId` pointed straight at `User.id`, bypassing `TutorProfile`
even though `TutorProfile` is the model that actually represents "this user
as a tutor" (certification `status`, `appliedSubjects`, `availability`).
Since `TutorProfile` is 1:1 with `User`, the two designs were functionally
equivalent, but referencing `TutorProfile` is the cleaner modeling choice —
a class belongs to a tutor's profile, not to the user account directly.

## Schema change

- `TutorClass.tutorId` (→ `users.id`) replaced with
  `TutorClass.tutorProfileId` (→ `tutor_profiles.id`), `onDelete: Cascade`.
- Removed `User.tutorClasses` back-relation (no longer needed).
- Added `TutorProfile.classes` back-relation.

## Why this couldn't be a plain `prisma migrate dev`

`prisma migrate dev` refused to run non-interactively because the table
already had 11 rows and the new `tutorProfileId` column has no default —
Prisma can't safely guess how to populate it. The migration SQL was written
by hand instead (`migration.sql` in this folder) to add the column,
backfill it, then enforce the constraint:

1. Drop the old `tutor_classes_tutorId_fkey` FK.
2. Add `tutorProfileId` as **nullable**.
3. Backfill: `UPDATE tutor_classes tc JOIN tutor_profiles tp ON tp.userId = tc.tutorId SET tc.tutorProfileId = tp.id`.
4. Make `tutorProfileId` `NOT NULL`.
5. Drop the old `tutorId` column.
6. Add the new `tutor_classes_tutorProfileId_fkey` FK.

Before running it, every existing `tutor_classes.tutorId` was confirmed to
have a matching `tutor_profiles.userId` row (all `STUDENT_TUTOR` accounts
get a `TutorProfile` at registration), so the backfill lost no rows.
Applied with `npx prisma migrate deploy`.

## Application code updated to match

- `src/app/api/tutor/classes/route.ts` (GET/POST) — resolves the caller's
  `TutorProfile.id` from the session first, then filters/creates by
  `tutorProfileId` instead of `tutorId`.
- `src/app/api/tutor/classes/[classId]/route.ts` (PATCH/DELETE) — ownership
  checks and the schedule-conflict query now use `tutorProfileId`.
- `src/app/api/classes/route.ts` (learner browse) — includes
  `tutorProfile.user` and reshapes the response so the JSON payload still
  exposes `tutor: { id, anonymousId }` unchanged for existing consumers.
- `prisma/seed.ts` — `ensureTutorProfile` now returns the profile it
  created/updated; class seeding and cleanup use `tutorProfileId`.
