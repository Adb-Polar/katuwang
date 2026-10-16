# Idempotent Prisma Database Seed Fix

## Problem Overview

Running `npx prisma db seed` fails at `prisma/seed.ts` with error `P2002`:
```text
Unique constraint failed on the constraint: tutor_classes_code_key
```

### Root Cause Analysis

1. **Stateful Unique Constraint vs In-Memory Counter**:
   - `TutorClass.code` has a `@unique` database index (`tutor_classes_code_key`).
   - `prisma/seed.ts` used an in-memory counter `let classCodeSeq = 0; const nextClassCode = () => 'C-${pad(++classCodeSeq, 4)}'` which starts from 0 on every script execution.
   - When classes already exist in the database (from previous seed runs, partial runs, or user activity), generating `C-0001`, `C-0002`, ..., `C-0014` collisions occur upon executing `prisma.tutorClass.create()`.

2. **Flawed `deleteMany` Workaround**:
   - The script previously attempted idempotency via:
     ```ts
     await prisma.tutorClass.deleteMany({ where: { tutorProfileId: { in: allProfileIds } } });
     ```
   - If previous seed executions had higher volume knobs (e.g. `SEED_TUTORS=100`), but a later run had lower volume (e.g. `SEED_TUTORS=10`), `allProfileIds` only contains the current run's tutor profiles. The leftover classes from previous tutors (e.g. `C-0014` owned by `gen.tutor.099`) were never deleted, causing immediate collision when the seeder tried to create `C-0014`.
   - Furthermore, using `deleteMany` destroys relational data (such as session test attempts and enrollments), violates non-destructive production data preservation requirements, and fails if external records refer to seeded rows.

3. **Missing Idempotency Across Other Entities**:
   - Question bank questions and attempt items were cleared via `deleteMany`, risking foreign key failures with `session_test_questions`.
   - `seedSessionTests` called `prisma.sessionTest.create({ data: { sessionId: ... } })` where `sessionId` is `@unique`, which would crash with P2002 if rerun.
   - Topic requests and notifications were created with raw `.create()` after clearing with `deleteMany`.

---

## Planned Changes

1. **Class Code Tracking and Allocation**:
   - Initialize `maxObservedCodeNum` by querying both `IdCounter` (role `"CLASS"`) and all existing codes in `tutor_classes`.
   - Implement `allocateClassCode(preferredCode)`:
     - If `preferredCode` is provided and available in `tutor_classes`, allocate it.
     - If taken, sequentially increment past the highest observed code until an unallocated code is found.
   - At the end of seeding, synchronize `IdCounter` for `"CLASS"` so it remains `Math.max(currentCount, highestObservedCode)` to prevent future collisions by user-created classes in the app.

2. **Idempotent `ensureTutorClass`**:
   - For curated classes (codes `C-0001` through `C-0013`) and request-fulfilled classes (`C-0014`, `C-0015`):
     - First, look for an existing class with the preferred `code`. If found and `tutorProfileId` matches, update the existing class without modifying its `id` or `code`.
     - If not found by code, look for an existing class matching `(tutorProfileId, subject, description)`. If found, preserve its existing ID and code.
     - If not found at all, allocate a unique code and create the class.
   - Synchronize topics, sessions, and enrollments without deleting existing sessions (preserving session test attempts).

3. **Procedural Classes Generation**:
   - Ensure `createGeneratedClass` calls `ensureTutorClass` with a deterministic preferred code (`C-${pad(16 + index, 4)}`).
   - Use the existing deterministic RNG sequence so reruns match existing classes.

4. **Eliminate All `deleteMany` Calls**:
   - Remove `prisma.tutorClass.deleteMany`.
   - Remove `prisma.topicRequest.deleteMany`.
   - Remove `prisma.notification.deleteMany`.
   - Remove `prisma.assessmentAttemptItem.deleteMany` and `prisma.assessmentQuestion.deleteMany`.

5. **Idempotent Helpers**:
   - `ensureTopicRequest`: Find by `(learnerId, subject, note)` or create.
   - `ensureNotification`: Find by `(userId, type, link)` or create.
   - `seedQuestionBank`: Check if question exists by `(subject, topic, prompt, origin: "BANK")` before creating.
   - `seedSessionTests`: Check if `sessionTest` already exists for `sessionId` before creating.

---

## Verification Plan

1. Run `npx prisma db seed` on the local database to verify it completes without errors.
2. Run `npx prisma db seed` a second consecutive time to verify full idempotency (0 errors, no duplicates).
3. Verify tests pass with `pnpm test`.
4. Verify TypeScript typechecking with `pnpm exec tsc --noEmit`.
