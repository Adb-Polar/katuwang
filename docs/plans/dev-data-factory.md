# Dev Data Factory

A development-only page + API for spawning test data (users, classes, enrollments,
topic requests) on demand, without re-running the full seed script.

## Motivation

`prisma/seed.ts` is all-or-nothing and idempotent-by-reset. During feature work you
often just want "give me 3 more learners" or "a class with an open slot" against the
current DB. The existing `/dev/login` quick-login page already establishes the
pattern (dev-only, guarded by `NODE_ENV !== "production"`, no auth). This adds a
sibling `/dev` hub with a data factory.

## Scope

- **`src/app/api/dev/route.ts`** — `POST` only, 404s in production. Discriminated
  union on `action`:
  - `createUsers` — N learners/tutors/admins with random PH names, `@dev.test`
    emails, password `password123`, anonymous IDs via `generateAnonymousId`,
    tutor profiles for tutors.
  - `createClass` — pick an existing tutor, a subject, K topics from
    `SUBJECT_TOPICS`, auto-generate future sessions; `code` via `generateClassCode`.
  - `enroll` — enrol a learner (or N random learners) into a class, respecting
    `maxStudents`.
  - `createTopicRequests` — N open requests from random learners.
  - `wipeDevData` — delete every `@dev.test` user (cascades to their classes,
    enrolments, requests). Seed data (`*.katuwang.test`, `*.seed.katuwang.test`)
    is untouched.
  - `GET` — current counts + short lists (tutors, learners, classes) for the UI.
- **`src/app/dev/page.tsx`** — server component, dev-only, renders the factory.
- **`src/components/dev/DevDataFactory.tsx`** — client forms for each action,
  posts to `/api/dev`, shows a running result log.
- **`src/app/dev/login/page.tsx`** — add a link back to `/dev`.

## Non-goals

- No new Prisma models or migrations.
- Not wired into any nav; reachable only by typing `/dev`.
- No production behaviour — both the page and the route hard-404 when
  `NODE_ENV === "production"`.

## 3NF / privacy

Writes go through the same tables and `generateAnonymousId` / `generateClassCode`
helpers the real flows use, so normalization and the sequential-ID invariant hold.
No peer-facing data is exposed — the page is single-operator dev tooling.
