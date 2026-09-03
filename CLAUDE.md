# Katuwang — Developer & AI Assistant Guide

**Katuwang** (Tagalog for *"helper"* / *"partner"*) is a specialized web-based peer tutoring and academic mentoring platform engineered for Junior and Senior High School students (Grades 7–12) within the Philippine K-12 educational framework.

---
### 📚 Context & Reference Docs — read before assuming scope

- **Start with [`docs/reference/project-overview.md`](docs/reference/project-overview.md)** for domain/business context (what Katuwang is, TRIS background, the 3 roles, the RA 10173 double-blind anonymity mandate, the six modules, domain vocabulary). It's the digest of the full capstone thesis at `docs/reference/Katuwang_...md` — that file is ~450KB; do not read it wholesale, use targeted `grep`/offset reads if you need the source text.
- **Check [`docs/reference/decisions.md`](docs/reference/decisions.md) before flagging anything as a "missing feature."** The thesis doc is a historical proposal snapshot, not a live spec — the running app has deliberately diverged from it in places (e.g. 3 roles only, no "Teacher Moderator"). This file is the authoritative record of those divergences and wins over the thesis text when they conflict.
- **[`docs/feature-checklist.md`](docs/feature-checklist.md)** tracks thesis-spec vs. actual build status per module — update it when a module's status changes.
- **[`docs/roles/{LEARNER,TUTOR,ADMIN}.md`](docs/roles/)** are the per-role feature + API reference — check the relevant one before building/changing anything in that role's portal.
- **[`docs/README.md`](docs/README.md)** indexes everything else (plans, ERD, theme tokens, auth build guide).

### Warning
- Do not commit anything 
- Do not push anything
- If asked to commit ask for confirmation
- database modification needs confirmation
- tables should be normalize 3NF
- every plan should be written on /docs/plans/{plan overview name}.md
- All changes must be logged on Changes.md
- When a decision diverges from the thesis reference doc (a role, a feature, a scope cut), log it in `docs/reference/decisions.md` and update `docs/feature-checklist.md` in the same change — don't let them go stale
## 🚀 Common Commands

This project uses **pnpm** as its package manager.

```bash
# Development server (runs on http://localhost:3000)
pnpm dev

# Typechecking
pnpm exec tsc --noEmit

# Linting (Next.js 16 flat config)
pnpm lint

# Running tests (Vitest)
pnpm test          # Run all tests once
pnpm test:watch    # Run tests in watch mode

# Production build
pnpm build
pnpm start

# Prisma / Database
npx prisma generate                       # Generate Prisma clie
npx prisma db push                        # Sync schema with database
npx prisma migrate dev --name <name>      # Create and apply migrations
npx prisma studio                         # Open database GUI
pnpm exec tsx prisma/seed.ts              # Run database seeder
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose / Role |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Monolithic full-stack application (RSC + Client Components) |
| **Language** | TypeScript 5 | Strict static typing across models, validations, and APIs |
| **UI & Styling** | Tailwind CSS 4 + DaisyUI 5 | Component styling using OKLCH color theme and semantic classes |
| **Icons** | Lucide React | Clean icon set for actions, status badges, and navigation |
| **Authentication** | NextAuth.js 4 | Credentials provider with JWT session strategy (`src/lib/auth.ts`) |
| **Database & ORM** | MariaDB / MySQL + Prisma 7 | Schema modeling, migrations, `@prisma/adapter-mariadb` |
| **Validation** | Zod 4 | Runtime request body validation and discriminated unions |
| **Testing** | Vitest 4 | Unit and API route integration tests |

---

## 📂 Project Structure

```
katuwang/
├── prisma/
│   ├── schema.prisma         # Prisma data models & enums
│   ├── migrations/           # SQL schema migrations
│   └── seed.ts               # Database seeding script
├── src/
│   ├── app/                  # Next.js App Router (pages & route handlers)
│   │   ├── api/              # REST Route Handlers (auth, register, tutor, classes)
│   │   ├── admin/            # Administrator portal (/admin)
│   │   ├── tutor/            # Student Tutor portal (/tutor)
│   │   ├── learner/          # Student Learner portal (/learner)
│   │   ├── dashboard/        # Smart role dispatcher (redirects to dedicated portal)
│   │   ├── login/            # Authentication login page
│   │   ├── register/         # Learner registration & tutor application flow
│   │   ├── unauthorized/     # Access denied screen
│   │   ├── globals.css       # Tailwind 4 & DaisyUI 5 theme definition
│   │   └── layout.tsx        # Root application layout
│   ├── components/           # Reusable UI components
│   │   ├── auth/             # LoginForm, LearnerRegisterForm, TutorRegisterForm
│   │   ├── tutor/            # ClassManagement, schedule forms, roster modals
│   │   ├── learner/          # ClassBrowser, enroll/unenroll views
│   │   └── providers/        # SessionProvider and client context wrappers
│   ├── lib/                  # Shared backend utilities and configurations
│   │   ├── auth.ts           # NextAuth configuration and callbacks
│   │   ├── prisma.ts         # Singleton Prisma MariaDB client
│   │   ├── idGenerator.ts    # Concurrency-safe sequential anonymous ID generator
│   │   └── validations/      # Zod validation schemas (auth, classes)
│   ├── proxy.ts              # NextAuth middleware route guards (RBAC)
│   └── types/                # Ambient and custom TypeScript type declarations
└── vitest.config.ts          # Vitest configuration with tsconfig paths
```

---

## 🔐 User Roles & Route Permissions

The system supports three distinct roles (`Role` enum in Prisma):

1. **`STUDENT_LEARNER`** ➔ Access to `/learner`, can browse scheduled classes, enroll, and unenroll.
2. **`STUDENT_TUTOR`** ➔ Access to `/tutor`, can apply for subjects, create/manage classes, view rosters.
3. **`ADMIN`** ➔ Access to `/admin`, manages users, platform settings, and reports.

- Route protection is enforced at the network edge via `src/proxy.ts` (NextAuth middleware).
- `/dashboard` acts as an automated dispatcher that resolves the user's session role and redirects them to their respective portal.

---

## 📋 Core Conventions & Development Guidelines

### 1. Student Privacy by Design (RA 10173 Compliance)
- **Double-blind Anonymity**: Learners and Tutors must never see each other's real names, emails, or personal contact info across peer boundaries.
- **Anonymous IDs**: Every student has a unique sequential ID (`STU-XXXX` for learners, `TUT-XXXX` for tutors).
- **ID Generation**: Always use `generateAnonymousId("TUTOR" | "LEARNER")` from `@/lib/idGenerator.ts`, which atomically increments the `IdCounter` table to prevent race conditions.
- Peer-facing queries and API responses should only select `id` and `anonymousId`.

### 2. Next.js 16 & React 19 Conventions
- Keep page components (`src/app/**/page.tsx`) lean Server Components. Fetch session/initial server data there, and delegate complex client state/interaction to components marked with `"use client"` in `src/components/`.
- Use Next.js 16 App Router patterns. Reference `node_modules/next/dist/docs/` when verifying any breaking API changes.

### 3. API Route Handlers (`src/app/api/**/route.ts`)
- **Authentication & RBAC**: Always verify session and required role using `getServerSession(authOptions)`:
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT_TUTOR") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  ```
- **Input Validation**: Validate incoming request JSON with Zod schemas (`src/lib/validations/`). Return `400` with the first validation error message if parsing fails.
- **Response Format**:
  - Errors: Return `{ error: string }` with appropriate status code (`400`, `401`, `403`, `404`, `409`, `500`).
  - Success: Return payload directly or `{ message: string, ... }` with status `200` or `201`.
  - Log server errors to `console.error` and return `{ error: "An unexpected error occurred. Please try again." }` (500).

### 4. Database Access (Prisma ORM)
- Always import the singleton instance: `import { prisma } from "@/lib/prisma"`.
- Wrap multi-table dependent operations in `prisma.$transaction(async (tx) => { ... })`.
- Ensure compound unique queries use generated key names (e.g. `where: { classId_learnerId: { classId, learnerId } }`).

### 5. UI Design & Styling (DaisyUI 5 + Tailwind 4)
- Adhere to the theme tokens defined in `src/app/globals.css` (OKLCH light palette: `bg-base-100`, `bg-base-200`, `text-base-content`, `btn-primary`, `btn-neutral`, `badge-success`, etc.).
- Use DaisyUI semantic components (`btn`, `badge`, `card`, `modal`, `tabs`, `table`, `alert`) instead of crafting bespoke custom styles.
- Maintain responsive, accessible layouts with standard Tailwind utility classes.

### 6. Testing Patterns (Vitest)
- Place unit and route tests in `__tests__/` subdirectories matching the source file name (e.g. `src/app/api/classes/__tests__/route.test.ts`).
- Mock `@/lib/prisma` with `vi.hoisted` and mock `next-auth`'s `getServerSession`.
- Test positive flows, validation errors (400), authentication/authorization guards (401/403), business rule conflicts (409), and 500 error resilience.
