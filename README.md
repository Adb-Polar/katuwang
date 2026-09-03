# Katuwang

**Katuwang** (Tagalog for *"helper"* / *"partner"*) is a free, web-based peer
tutoring management platform built for **Taysan Resettlement Integrated
School (TRIS)** in Legazpi City, Albay — a Philippine public secondary
school serving Grades 7–12. It connects student tutors with student learners
so peer academic support can be organized and moderated instead of ad hoc,
under a strict double-blind anonymity model (RA 10173 compliance).

This is an undergraduate capstone project (Bicol University, BS Information
Technology).

For domain/business context — what the platform is, the three user roles,
the privacy mandate, and the six core modules — start at
[`docs/reference/project-overview.md`](docs/reference/project-overview.md).
Engineering conventions, stack details, and project structure live in
[`CLAUDE.md`](CLAUDE.md).

## Tech Stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS 4 + DaisyUI 5,
NextAuth.js 4, Prisma 7 on MariaDB/MySQL, Zod 4, Vitest 4. Package manager:
**pnpm**. Full table in [`CLAUDE.md`](CLAUDE.md#-technology-stack).

## Getting Started

```bash
pnpm install

# create .env with:
#   DATABASE_URL=
#   NEXTAUTH_URL=
#   NEXTAUTH_SECRET=

npx prisma generate
npx prisma db push        # sync schema with your local database

pnpm dev                  # http://localhost:3000
```

Other common commands:

```bash
pnpm exec tsc --noEmit    # typecheck
pnpm lint                 # lint (Next.js 16 flat config)
pnpm test                 # run tests once (Vitest)
pnpm test:watch           # tests in watch mode
pnpm build && pnpm start  # production build
npx prisma studio         # DB GUI
pnpm exec tsx prisma/seed.ts  # seed the database
```

## Project Docs

| Where | What |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Engineering conventions, tech stack, project structure, RBAC/API/DB patterns |
| [`docs/reference/project-overview.md`](docs/reference/project-overview.md) | Domain/business context — start here for "what is this and why" |
| [`docs/reference/decisions.md`](docs/reference/decisions.md) | Where the app deliberately diverges from the original thesis spec |
| [`docs/feature-checklist.md`](docs/feature-checklist.md) | Thesis-spec vs. actual build status, module by module |
| [`docs/roles/`](docs/roles/) | Per-role feature + API reference (Learner, Tutor, Admin) |
| [`docs/plans/`](docs/plans/) | Implementation plans, active and historical |
| [`docs/README.md`](docs/README.md) | Full docs index |

## Status

Five of six core modules are built and working (User Management, Session
Management, Tutor Matching, tutor-side Assessment/Certification, Analytics
Dashboard). The Chatbot Assistant module and a learner-facing pre-/post-test
assessment are not yet implemented — see
[`docs/feature-checklist.md`](docs/feature-checklist.md) for the full
breakdown.
