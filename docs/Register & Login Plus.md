**Stack:** Next.js 16.2.4 · React 19 · TypeScript · Tailwind CSS 4 · NextAuth.js 4.24.14 · Prisma 7.7.0 · MySQL 9.7.0 · bcrypt

---

## Table of Contents

**Part 0 — Before You Start (Read This First)**
- [0.1 What Each Technology Does](#01-what-each-technology-does)
- [0.2 How They All Connect](#02-how-they-all-connect)
- [0.3 Key Concepts You Must Understand](#03-key-concepts-you-must-understand)
- [0.4 Setting Up Your Machine](#04-setting-up-your-machine)
- [0.5 Creating the Next.js Project](#05-creating-the-nextjs-project)

**Part 1 — Building the System**
1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [Prisma Setup](#4-prisma-setup)
5. [Environment Variables](#5-environment-variables)
6. [NextAuth.js Configuration](#6-nextauthjs-configuration)
7. [Registration API Route](#7-registration-api-route)
8. [Login API Route](#8-login-api-route)
9. [Registration Forms (UI)](#9-registration-forms-ui)
10. [Login Form (UI)](#10-login-form-ui)
11. [Middleware — Route Protection](#11-middleware--route-protection)
12. [Role-Based Access Control (RBAC)](#12-role-based-access-control-rbac)
13. [Anonymized ID Generation](#13-anonymized-id-generation)
14. [Data Privacy Compliance Notes](#14-data-privacy-compliance-notes)
15. [Testing Checklist](#15-testing-checklist)

**Part 2 — Troubleshooting & Common Mistakes**
- [Common Errors and Fixes](#common-errors-and-fixes)

---

# Part 0 — Before You Start (Read This First)

> If you have never built a web app with this stack before, read all of Part 0 carefully before touching any code. Skipping this section is the most common reason beginners get stuck.

---

## 0.1 What Each Technology Does

Think of building Katuwang like building a school building. Each technology is a different trade:

| Technology | What it is | What it does in Katuwang | Analogy |
|---|---|---|---|
| **Next.js** | A React framework | Manages pages, routing, and API endpoints all in one project | The building's blueprint |
| **React** | A JavaScript UI library | Builds the interactive forms and pages users see | Interior design |
| **TypeScript** | JavaScript with type safety | Catches mistakes before you run the code | A proofreader for your code |
| **Tailwind CSS** | A utility CSS framework | Styles the UI using short class names like `text-red-500` | Paint and furniture |
| **NextAuth.js** | An authentication library | Handles login sessions, cookies, and role-based access | The school's security guard |
| **Prisma** | An ORM (Object-Relational Mapper) | Lets you write TypeScript code that talks to MySQL instead of raw SQL | A translator between your code and the database |
| **MySQL** | A relational database | Stores all user accounts, sessions, and records permanently | The school's filing cabinet |
| **bcrypt** | A password hashing library | Converts passwords into scrambled strings so they can never be read — not even by you | A one-way paper shredder for passwords |

---

## 0.2 How They All Connect

Here is the exact flow of what happens when a student registers on Katuwang:

```
1. Student fills out the form (React + Tailwind CSS)
         ↓
2. Browser sends data to the server (Next.js API Route)
         ↓
3. Server validates the data and hashes the password (bcrypt)
         ↓
4. Server generates a unique anonymous ID (TUT-XXXX / STU-XXXX)
         ↓
5. Server saves the new user to the database (Prisma → MySQL)
         ↓
6. Server responds with success or error message
         ↓
7. Browser redirects to the login page
```

And when a student logs in:

```
1. Student enters email + password (React form)
         ↓
2. NextAuth receives the credentials
         ↓
3. NextAuth looks up the user in the database (Prisma → MySQL)
         ↓
4. NextAuth compares the entered password against the bcrypt hash
         ↓
5. If correct: NextAuth creates a secure session (JWT token stored in cookie)
         ↓
6. Next.js Middleware checks the session on every protected page visit
         ↓
7. User sees only the pages their role is allowed to access (RBAC)
```

---

## 0.3 Key Concepts You Must Understand

### What is an API Route?

An API route is a URL on your own server that your frontend can call to do things — like save a user to the database. In Next.js, any file inside `src/app/api/` automatically becomes an API endpoint.

For example:
- File at `src/app/api/register/route.ts`
- Becomes the URL: `http://localhost:3000/api/register`
- Your registration form calls this URL via `fetch("/api/register", ...)`

Think of it as a window at a school office. Students (the browser) pass requests through the window, and the staff (the server) handles them.

---

### What is a JWT (JSON Web Token)?

After a user logs in, the server needs a way to remember who they are on every subsequent page visit — because the web is "stateless" (the server doesn't remember you between requests).

A JWT is a small encrypted text string that the server generates after login and stores in a cookie on the user's browser. On every request, the browser automatically sends that cookie back, and the server reads it to know: *"This is TUT-0001, a Student Tutor."*

```
JWT looks like this (three parts separated by dots):
eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiU1RVREVOVCJfVFVUT1IifQ.abc123xyz
      Header                        Payload                  Signature
```

You never need to generate JWTs manually — NextAuth.js does it for you. But you need to understand that:
- The **payload** contains your user's role, ID, and anonymousId
- The **signature** is created using your `NEXTAUTH_SECRET` — which is why that secret must never be shared
- It expires after 8 hours (configured in `authOptions`)

---

### What is Password Hashing?

You must **never** store a user's password directly in the database. If your database were ever breached, everyone's passwords would be exposed.

Instead, bcrypt converts the password into a fixed-length scrambled string called a **hash**:

```
Password:  "mypassword123"
     ↓ bcrypt hashes it
Hash:      "$2b$12$KIXoHa9mF3Jz1PqD7tN8.eVKhGqA2bXvP0rT4yO8mW1sN5uE3c6a"
```

This is **one-way** — you can never reverse it back to the original password. When a user logs in, bcrypt re-hashes what they typed and compares the two hashes. If they match, the password is correct.

The number `12` in `bcrypt.hash(password, 12)` is the **cost factor** — it controls how long hashing takes. Higher = slower = harder for attackers to brute-force. 12 is the recommended default.

---

### What is an ORM (Object-Relational Mapper)?

Without Prisma, you would write raw SQL to talk to MySQL:

```sql
-- Raw SQL (no Prisma)
INSERT INTO users (full_name, email, password) VALUES ('Juan Cruz', 'juan@email.com', 'hashed');
```

With Prisma, you write TypeScript instead:

```typescript
// With Prisma
await prisma.user.create({
  data: { fullName: "Juan Cruz", email: "juan@email.com", password: "hashed" }
});
```

Prisma translates your TypeScript into SQL automatically. This means:
- No SQL syntax errors
- TypeScript knows the shape of your data (autocomplete works)
- Easier to read and maintain

---

### What is RBAC (Role-Based Access Control)?

In Katuwang, different users should see different things:

| Role | Can see |
|---|---|
| Student Learner | Their own sessions, tutoring requests |
| Student Tutor | Their sessions, matched learners |
| Teacher Moderator | Analytics, all sessions |
| Administrator | Everything |

RBAC means: instead of checking permissions item by item, you assign a **role** to each user and then define what each role is allowed to do. The user's role is stored in the database and included in their JWT session token — so the server can check it on every request.

---

### What is Middleware?

Middleware is code that runs **before** a page is served to the user. Think of it as a checkpoint.

When a student tries to visit `/admin`, the middleware runs first:
1. It reads the JWT cookie
2. It checks the user's role
3. If the role is not `ADMIN`, it redirects them away **before they ever see the page**

This is the most important security layer. Never rely only on hiding buttons in the UI — always enforce access at the middleware level.

---

### What is Prisma Schema?

The Prisma schema (`prisma/schema.prisma`) is a text file where you define what your database tables look like. Prisma reads this file and creates the actual MySQL tables for you.

```prisma
model User {
  id       String @id    // Primary key — unique row identifier
  email    String @unique // No two users can have the same email
  password String         // Stores the bcrypt hash
}
```

Each `model` becomes a table in MySQL. Each field becomes a column.

---

## 0.4 Setting Up Your Machine

You need the following installed before writing any code. Follow these steps in order.

### Step 1 — Install Node.js

Node.js lets you run JavaScript/TypeScript on your computer (outside the browser). Next.js requires it.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (not "Current")
3. Run the installer
4. Verify it worked — open your terminal and type:

```bash
node --version
# Should print something like: v20.11.0

npm --version
# Should print something like: 10.2.4
```

> **What is the terminal?** On Windows: search for "Command Prompt" or "PowerShell". On Mac: search for "Terminal". This is where you type commands to run your project.

---

### Step 2 — Install MySQL

MySQL is where all your data is stored permanently.

1. Go to [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
2. Download **MySQL Community Server** for your operating system
3. During installation, set a **root password** — write this down, you will need it
4. Verify it worked:

```bash
mysql --version
# Should print something like: mysql  Ver 9.7.0
```

5. Create the database for Katuwang:

```bash
mysql -u root -p
# Enter your root password when prompted
```

Then inside the MySQL shell:

```sql
CREATE DATABASE katuwang_db;
EXIT;
```

---

### Step 3 — Install Visual Studio Code

VS Code is the code editor you will use to write everything.

1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download and install it
3. Open VS Code and install these extensions (click the Extensions icon on the left sidebar):
   - **Prisma** — syntax highlighting for `.prisma` files
   - **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
   - **ESLint** — catches code errors
   - **TypeScript Vue Plugin** *(optional but helpful)*

---

### Step 4 — Install Git *(optional but recommended)*

Git lets you save your project history and undo mistakes.

1. Go to [https://git-scm.com](https://git-scm.com) and install it
2. In your terminal:

```bash
git --version
# Should print something like: git version 2.43.0
```

---

## 0.5 Creating the Next.js Project

### Step 1 — Create the project

Open your terminal, navigate to wherever you keep your projects, and run:

```bash
npx create-next-app@latest katuwang
```

You will be asked several questions. Answer exactly like this:

```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Would you like to use the `src/` directory? › Yes
✔ Would you like to use App Router? › Yes
✔ Would you like to customize the default import alias (@/*)? › No
```

This creates a folder called `katuwang` with everything set up.

### Step 2 — Open it in VS Code

```bash
cd katuwang
code .
```

### Step 3 — Start the development server

```bash
npm run dev
```

Open your browser and go to `http://localhost:3000`. You should see the default Next.js welcome page. This means everything is working.

> **What is `localhost:3000`?** Your computer is acting as both the server and the browser. Port 3000 is just the "door" your Next.js development server is running behind. When you deploy to the real internet later, users will use a normal URL instead.

### Step 4 — Install all required packages

Stop the dev server first (`Ctrl + C` in the terminal), then run:

```bash
npm install @prisma/client prisma bcryptjs next-auth
npm install --save-dev @types/bcryptjs
```

> **What is `npm install`?** npm (Node Package Manager) downloads code libraries that other developers wrote, so you don't have to build everything from scratch. `--save-dev` means "only needed during development, not in production".

### Step 5 — Verify your folder structure

After installation, your project root should look like this:

```
katuwang/
├── node_modules/      ← Downloaded packages (never edit this)
├── prisma/            ← Will be created in the next step
├── public/            ← Static files (images, icons)
├── src/
│   ├── app/           ← All pages and API routes
│   └── ...
├── .env.local         ← Will be created in Section 5
├── package.json       ← Lists your project's dependencies
└── next.config.ts     ← Next.js configuration
```

---

# Part 1 — Building the System

---

## 1. Overview

Katuwang has **four user roles**, each with its own registration path and permissions:

| Role | ID Format | Registers Via | Notes |
|---|---|---|---|
| Student Learner | `STU-0001` | Public registration form | Immediate access after signup |
| Student Tutor | `TUT-0001` | Public registration form | Account created but **locked** until subject assessment(s) passed |
| Teacher Moderator | Admin-created | Admin dashboard | No self-registration |
| Administrator | Seeded / Admin-created | Admin dashboard | No self-registration |

The registration and login system is built on three layers:

```
Browser (React/Next.js UI)
    ↓
API Routes (Next.js API / NextAuth.js)
    ↓
Database (Prisma ORM → MySQL)
```

---

## 2. Project Structure

> **Why do we organize files this way?** Next.js uses "file-based routing" — the folder structure inside `src/app/` directly maps to URLs. A file at `src/app/login/page.tsx` becomes the page at `http://localhost:3000/login`. This makes it easy to know where every page lives just by looking at the folder tree.

```
katuwang/
├── prisma/
│   ├── schema.prisma          # Defines all database tables
│   └── seed.ts                # Seeds initial data (ID counters)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth handler (handles login)
│   │   │   └── register/
│   │   │       └── route.ts       # Registration API endpoint
│   │   ├── (auth)/                # Route group — pages here share a layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # /login page
│   │   │   └── register/
│   │   │       ├── page.tsx       # /register role-selector page
│   │   │       ├── learner/
│   │   │       │   └── page.tsx   # /register/learner page
│   │   │       └── tutor/
│   │   │           └── page.tsx   # /register/tutor page
│   │   └── dashboard/
│   │       └── page.tsx           # Role-based redirect after login
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx           # Login form UI component
│   │       ├── LearnerRegisterForm.tsx # Learner form UI component
│   │       └── TutorRegisterForm.tsx   # Tutor form UI component
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration (shared)
│   │   ├── prisma.ts              # Prisma client (database connection)
│   │   └── idGenerator.ts         # TUT-XXXX / STU-XXXX logic
│   ├── middleware.ts              # Route protection (runs before pages)
│   └── types/
│       └── next-auth.d.ts         # Tells TypeScript about our custom session fields
├── .env.local                     # Secret environment variables
└── next.config.ts
```

> **What is `(auth)/`?** Parentheses in a folder name create a "route group" in Next.js. It groups related pages together without affecting the URL. The `(auth)` folder just means "these are authentication-related pages" — the URL is still `/login`, not `/auth/login`.

> **What is `[...nextauth]`?** Square brackets mean a "dynamic route" in Next.js. The `...` means it catches all paths. NextAuth.js needs this to handle multiple internal URLs like `/api/auth/signin`, `/api/auth/callback`, etc.

---

## 3. Database Schema

> **What is a schema?** A schema is a blueprint of your database. It defines what tables exist, what columns they have, and how they relate to each other. In Prisma, you write this in `prisma/schema.prisma` using Prisma's own language, and Prisma creates the actual MySQL tables from it.

### 3.1 Create the schema file

Create the file `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  // This tells Prisma to generate TypeScript code we can import
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  // env("DATABASE_URL") reads the connection string from .env.local
}

// ─── Enums ────────────────────────────────────────────────────────────────────
// Enums are a list of allowed values for a field.
// Instead of storing "student_tutor" as freeform text (which could have typos),
// we restrict it to a defined set of options.

enum Role {
  ADMIN
  TEACHER_MODERATOR
  STUDENT_TUTOR
  STUDENT_LEARNER
}

enum GradeLevel {
  GRADE_7
  GRADE_8
  GRADE_9
  GRADE_10
  GRADE_11
  GRADE_12
}

enum TutorStatus {
  PENDING      // Registered, no assessments taken yet
  PARTIAL      // Some subjects certified, others pending
  CERTIFIED    // All applied subjects passed
  REJECTED     // Failed all assessments
}

enum SubjectArea {
  MATH
  ENGLISH
  SCIENCE
  FILIPINO
  ARALING_PANLIPUNAN
  TLE
  MAPEH
}

// ─── User ─────────────────────────────────────────────────────────────────────
// This is the main table. Every person using the system has one row here.

model User {
  id            String     @id @default(cuid())
  // @id = primary key (unique identifier for each row)
  // @default(cuid()) = auto-generate a unique ID like "clx7abc123"

  anonymousId   String     @unique
  // This is TUT-0001 or STU-0001 — the only ID shown to other users
  // @unique = no two users can have the same anonymousId

  fullName      String
  // Stored privately — never shown to other students

  email         String     @unique
  // Used for login. @unique prevents duplicate accounts.

  password      String
  // IMPORTANT: This stores the BCRYPT HASH, never the real password

  role          Role
  // One of: ADMIN, TEACHER_MODERATOR, STUDENT_TUTOR, STUDENT_LEARNER

  gradeLevel    GradeLevel
  section       String
  contactInfo   String?
  // The ? means this field is optional (can be null/empty)

  consentGiven  Boolean    @default(false)
  // Must be true before account is created (RA 10173 compliance)

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  // @updatedAt automatically updates whenever the row changes

  // Relations — linking to other tables
  tutorProfile  TutorProfile?
  // A User may have a TutorProfile (only if they are a STUDENT_TUTOR)
  // The ? means it's optional (learners don't have one)

  sessions      Session[]
  assessments   Assessment[]
  // [] means "many" — one user can have many sessions and assessments

  @@map("users")
  // The actual MySQL table name will be "users" (lowercase)
}

// ─── Tutor Profile ────────────────────────────────────────────────────────────
// Extra information specific to Student Tutors.
// We put this in a separate table to keep the User table clean.

model TutorProfile {
  id              String       @id @default(cuid())

  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id])
  // This links TutorProfile back to the User table.
  // fields: [userId] = the column in THIS table
  // references: [id] = the column in the USER table it points to

  status          TutorStatus  @default(PENDING)
  // Starts as PENDING until they pass their qualifying assessments

  appliedSubjects SubjectApplication[]
  // One tutor can apply for many subjects

  availability    Json
  // Stores the schedule as JSON: [{ day: "Monday", startTime: "14:00", endTime: "16:00" }]
  // We use Json type because the structure is flexible

  @@map("tutor_profiles")
}

// ─── Subject Application ──────────────────────────────────────────────────────
// Tracks which subjects a tutor applied for and whether they are certified.
// One row per subject per tutor.

model SubjectApplication {
  id              String       @id @default(cuid())

  tutorProfileId  String
  tutorProfile    TutorProfile @relation(fields: [tutorProfileId], references: [id])

  subject         SubjectArea
  // Which subject (MATH, ENGLISH, etc.)

  certified       Boolean      @default(false)
  // false = assessment not yet passed, true = certified for this subject

  attemptedAt     DateTime?
  certifiedAt     DateTime?

  @@unique([tutorProfileId, subject])
  // A tutor cannot apply for the same subject twice
  // This composite unique constraint enforces that at the database level

  @@map("subject_applications")
}

// ─── ID Counter ───────────────────────────────────────────────────────────────
// Tracks the last-used number for TUT-XXXX and STU-XXXX generation.
// One row for "TUTOR", one row for "LEARNER".

model IdCounter {
  role    String  @id
  // "TUTOR" or "LEARNER"
  count   Int     @default(0)
  // Starts at 0. First registration increments to 1 → TUT-0001

  @@map("id_counters")
}
```

---

## 4. Prisma Setup

### 4.1 Install dependencies

```bash
npm install @prisma/client prisma bcryptjs next-auth
npm install --save-dev @types/bcryptjs
```

### 4.2 Initialize Prisma

```bash
npx prisma init
```

> This creates the `prisma/` folder and a default `schema.prisma`. Replace its contents with the schema above.

### 4.3 Push schema to MySQL

> **What does "push" mean?** It reads your `schema.prisma` and creates the actual tables in your MySQL database. Think of it as sending the blueprint to the construction crew.

```bash
npx prisma db push
```

If successful, you'll see:

```
🚀  Your database is now in sync with your Prisma schema.
```

You can verify by opening MySQL and checking:

```bash
mysql -u root -p katuwang_db
SHOW TABLES;
# Should show: users, tutor_profiles, subject_applications, id_counters
```

### 4.4 Seed the ID counters

> **What is seeding?** Seeding is inserting initial data into your database before real users exist. We need to create the two counter rows (`TUTOR` and `LEARNER`) upfront, or the first registration will fail because there's no row to increment.

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create the TUTOR counter starting at 0
  await prisma.idCounter.upsert({
    where: { role: "TUTOR" },
    update: {},
    // upsert = "insert if not exists, update if exists"
    // update: {} means "if it already exists, don't change anything"
    create: { role: "TUTOR", count: 0 },
  });

  // Create the LEARNER counter starting at 0
  await prisma.idCounter.upsert({
    where: { role: "LEARNER" },
    update: {},
    create: { role: "LEARNER", count: 0 },
  });

  console.log("✅ Seed complete. ID counters created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
  // Always disconnect from the database when done
```

Add the seed script to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Install ts-node (needed to run TypeScript files directly):

```bash
npm install --save-dev ts-node
```

Run the seed:

```bash
npx prisma db seed
```

### 4.5 Prisma client singleton (`src/lib/prisma.ts`)

> **Why a singleton?** In development, Next.js reloads your code frequently. Without this pattern, you'd create a new database connection on every reload, quickly exhausting MySQL's connection limit. The singleton reuses one connection across all requests.

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

// Attach the prisma client to the global object in development
// so it persists across hot-reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error"]  // Print every SQL query in development
      : ["error"],           // Only print errors in production
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 5. Environment Variables

> **What are environment variables?** They are secret values your app needs but that you should never write directly in your code (because code is often shared on GitHub). They live in a file called `.env.local` that you keep private.

Create `.env.local` in your project root (same level as `package.json`):

```env
# ── Database Connection ──────────────────────────────────────────────────────
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
# Replace "your_password" with the MySQL root password you set during installation
DATABASE_URL="mysql://root:your_password@localhost:3306/katuwang_db"

# ── NextAuth ─────────────────────────────────────────────────────────────────
# The URL of your app (in development, this is always localhost:3000)
NEXTAUTH_URL="http://localhost:3000"

# A secret key used to sign JWTs. Must be long, random, and NEVER shared.
# Generate one by running this in your terminal:
#   openssl rand -base64 32
# Then paste the result here:
NEXTAUTH_SECRET="paste-your-generated-secret-here"
```

**Generating the secret on Windows (if you don't have openssl):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> **Critical:** Add `.env.local` to your `.gitignore` file so it is never uploaded to GitHub:
> ```
> # In .gitignore
> .env.local
> ```

---

## 6. NextAuth.js Configuration

> **What does NextAuth.js do exactly?** It handles the entire login flow for you:
> - Receives the email + password from the login form
> - Looks up the user in the database
> - Compares the password using bcrypt
> - Creates a JWT (session token) and stores it in a secure cookie
> - Exposes the user's data to your pages via `useSession()` and `getServerSession()`
>
> Without NextAuth, you'd have to build all of this from scratch.

### 6.1 Extend session types (`src/types/next-auth.d.ts`)

> **Why do we need this file?** By default, NextAuth's session only gives you `name`, `email`, and `image`. We need it to also include `role`, `anonymousId`, and `id`. This file tells TypeScript about those extra fields.

Create the `src/types/` folder, then create `src/types/next-auth.d.ts`:

```typescript
// This file extends NextAuth's built-in types
// so TypeScript knows about our custom fields

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId: string;      // e.g., "TUT-0001" or "STU-0023"
      role: "ADMIN" | "TEACHER_MODERATOR" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
      fullName: string;
      email: string;
    };
  }

  interface User {
    id: string;
    anonymousId: string;
    role: "ADMIN" | "TEACHER_MODERATOR" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    anonymousId: string;
    role: "ADMIN" | "TEACHER_MODERATOR" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
    fullName: string;
  }
}
```

### 6.2 Auth options (`src/lib/auth.ts`)

> **What is `CredentialsProvider`?** It tells NextAuth "we are using email + password for login" (as opposed to Google, Facebook, or other social logins). The `authorize` function is where you write your own logic for verifying the credentials.

Create `src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // These define what fields the login form sends
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // This function runs when someone submits the login form
      // Return the user object if login succeeds, throw an error if it fails
      async authorize(credentials) {
        // Step 1: Make sure both fields were provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Step 2: Look up the user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Step 3: If no user found, reject
        if (!user) {
          throw new Error("No account found with that email.");
        }

        // Step 4: Compare the entered password against the stored hash
        // bcrypt.compare returns true if they match, false if not
        const passwordMatch = await bcrypt.compare(
          credentials.password,  // What the user typed
          user.password           // The bcrypt hash stored in the database
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password.");
        }

        // Step 5: Return the user data that will be stored in the JWT
        // IMPORTANT: Do NOT include the password here
        return {
          id: user.id,
          anonymousId: user.anonymousId,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        };
      },
    }),
  ],

  callbacks: {
    // The jwt callback runs when the JWT is created or updated
    // "token" is the JWT being built; "user" is what authorize() returned
    async jwt({ token, user }) {
      if (user) {
        // Copy our custom fields from user into the token
        token.id = user.id;
        token.anonymousId = user.anonymousId;
        token.role = user.role;
        token.fullName = user.fullName;
      }
      return token;
    },

    // The session callback runs whenever a page requests the session
    // It controls what data is exposed to the browser
    async session({ session, token }) {
      if (token) {
        // Copy our custom fields from the token into the session
        // This is what useSession() and getServerSession() return
        session.user.id = token.id;
        session.user.anonymousId = token.anonymousId;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",   // Use our custom login page instead of NextAuth's default
    error: "/login",    // Send auth errors back to the login page
  },

  session: {
    strategy: "jwt",          // Store session in a JWT cookie (not a database table)
    maxAge: 8 * 60 * 60,     // Session expires after 8 hours (in seconds)
  },

  secret: process.env.NEXTAUTH_SECRET,
};
```

### 6.3 NextAuth route handler (`src/app/api/auth/[...nextauth]/route.ts`)

> **Why do we need this?** NextAuth needs its own API endpoints to handle the login POST request, sign-out, and session checks. This file wires all of that up automatically. You don't need to understand the internals — just create the file.

First, create the folder: `src/app/api/auth/[...nextauth]/`

Then create `route.ts` inside it:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth handles both GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

> **What is `@/lib/auth`?** The `@/` is an alias for your `src/` folder, configured automatically by `create-next-app`. So `@/lib/auth` means `src/lib/auth.ts`. It makes imports cleaner than `"../../../lib/auth"`.

---

## 7. Registration API Route

> **What is an API route?** It's a server-side function that the browser calls via `fetch()`. When the registration form is submitted, the browser sends the form data to `/api/register`, and this file handles it — validates the input, hashes the password, and saves the user to the database.
>
> **Why not save to the database directly from the form?** Forms run in the browser, which is public. If you put your database credentials in the browser, anyone could see them. API routes run on the server, which is private.

### 7.1 Anonymized ID generator (`src/lib/idGenerator.ts`)

Create the `src/lib/` folder, then create `idGenerator.ts`:

```typescript
import { prisma } from "./prisma";

/**
 * Generates the next sequential anonymous ID for a given role.
 *
 * How it works:
 * 1. Find the current counter row for this role ("TUTOR" or "LEARNER")
 * 2. Increment the count by 1 atomically (safely even if two users register at the same time)
 * 3. Pad the number with leading zeros to 4 digits
 * 4. Return the formatted ID
 *
 * Examples:
 *   generateAnonymousId("TUTOR")   → "TUT-0001" (first tutor)
 *   generateAnonymousId("TUTOR")   → "TUT-0002" (second tutor)
 *   generateAnonymousId("LEARNER") → "STU-0001" (first learner — separate counter)
 */
export async function generateAnonymousId(
  role: "TUTOR" | "LEARNER"
): Promise<string> {
  const prefix = role === "TUTOR" ? "TUT" : "STU";

  // prisma.idCounter.update with { increment: 1 } is atomic —
  // MySQL handles the increment safely even under concurrent requests
  const updated = await prisma.idCounter.update({
    where: { role },
    data: { count: { increment: 1 } },
  });

  // padStart(4, "0") adds leading zeros: 1 → "0001", 23 → "0023"
  const padded = String(updated.count).padStart(4, "0");
  return `${prefix}-${padded}`;
}
```

### 7.2 Registration route (`src/app/api/register/route.ts`)

Create the folder `src/app/api/register/`, then create `route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";
import { Role, GradeLevel, SubjectArea } from "@prisma/client";

// Next.js calls this function when a POST request is made to /api/register
export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body sent by the registration form
    const body = await req.json();
    const { type } = body; // "LEARNER" or "TUTOR"

    if (type === "LEARNER") {
      return await registerLearner(body);
    } else if (type === "TUTOR") {
      return await registerTutor(body);
    } else {
      return NextResponse.json(
        { error: "Invalid registration type." },
        { status: 400 }
        // HTTP 400 = Bad Request
      );
    }
  } catch (error) {
    // Log the full error on the server for debugging
    console.error("Registration error:", error);

    // Send a safe, generic message to the browser (never expose internal errors)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
      // HTTP 500 = Internal Server Error
    );
  }
}

// ─── Register a Student Learner ───────────────────────────────────────────────

async function registerLearner(body: any) {
  const {
    fullName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    consentGiven,
  } = body;

  // Validate: check all required fields are present
  if (!fullName || !email || !password || !gradeLevel || !section) {
    return NextResponse.json(
      { error: "All required fields must be filled in." },
      { status: 400 }
    );
  }

  // Validate: consent is required (RA 10173)
  if (!consentGiven) {
    return NextResponse.json(
      { error: "Parental/guardian consent is required to register." },
      { status: 400 }
    );
  }

  // Check if the email is already in use
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
      // HTTP 409 = Conflict (duplicate resource)
    );
  }

  // Hash the password before saving
  // The "12" is the cost factor — higher = more secure but slower
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate STU-XXXX anonymous ID
  const anonymousId = await generateAnonymousId("LEARNER");

  // Save the new user to the database
  const user = await prisma.user.create({
    data: {
      anonymousId,
      fullName,
      email,
      password: hashedPassword, // ← NEVER the original password
      role: Role.STUDENT_LEARNER,
      gradeLevel: gradeLevel as GradeLevel,
      section,
      contactInfo: contactInfo ?? null,
      consentGiven,
    },
    // Only return safe fields — never return the password hash
    select: {
      anonymousId: true,
      email: true,
      role: true,
    },
  });

  // HTTP 201 = Created (success)
  return NextResponse.json(
    {
      message: "Registration successful.",
      anonymousId: user.anonymousId,
    },
    { status: 201 }
  );
}

// ─── Register a Student Tutor ─────────────────────────────────────────────────

async function registerTutor(body: any) {
  const {
    fullName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    subjects,      // string[] — selected subject areas (multi-select)
    availability,  // [{ day, startTime, endTime }]
    consentGiven,
  } = body;

  // Validate required fields
  if (
    !fullName || !email || !password || !gradeLevel || !section ||
    !subjects || subjects.length === 0 ||
    !availability || availability.length === 0
  ) {
    return NextResponse.json(
      { error: "All required fields must be filled in." },
      { status: 400 }
    );
  }

  if (!consentGiven) {
    return NextResponse.json(
      { error: "Parental/guardian consent is required to register." },
      { status: 400 }
    );
  }

  // Validate that each subject is a valid enum value
  // This prevents someone from sending "HACKING" as a subject
  const validSubjects = Object.values(SubjectArea);
  const invalidSubjects = subjects.filter(
    (s: string) => !validSubjects.includes(s as SubjectArea)
  );
  if (invalidSubjects.length > 0) {
    return NextResponse.json(
      { error: `Invalid subject(s): ${invalidSubjects.join(", ")}` },
      { status: 400 }
    );
  }

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const anonymousId = await generateAnonymousId("TUTOR");

  // Use a Prisma transaction to create the user, tutor profile,
  // and all subject applications in a single atomic operation.
  //
  // What is a transaction?
  // If any step fails (e.g., the subject application insert fails),
  // the entire operation is rolled back — the user record is also deleted.
  // This prevents "half-created" accounts in the database.
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        anonymousId,
        fullName,
        email,
        password: hashedPassword,
        role: Role.STUDENT_TUTOR,
        gradeLevel: gradeLevel as GradeLevel,
        section,
        contactInfo: contactInfo ?? null,
        consentGiven,
        tutorProfile: {
          create: {
            status: "PENDING",
            availability,
            // Create one SubjectApplication row for each selected subject
            appliedSubjects: {
              create: subjects.map((subject: SubjectArea) => ({
                subject,
                certified: false,
              })),
            },
          },
        },
      },
      select: {
        anonymousId: true,
        email: true,
        role: true,
        tutorProfile: {
          select: {
            appliedSubjects: { select: { subject: true } },
          },
        },
      },
    });

    return newUser;
  });

  return NextResponse.json(
    {
      message:
        "Registration successful. You must complete a qualifying assessment for each subject before you can be matched with learners.",
      anonymousId: user.anonymousId,
      pendingAssessments: user.tutorProfile?.appliedSubjects.map(
        (s) => s.subject
      ),
    },
    { status: 201 }
  );
}
```

---

## 8. Login API Route

> **Good news:** You do **not** need to write a login API route manually. NextAuth.js handles the entire login flow through the route handler you created in Section 6.3.
>
> When the login form calls `signIn("credentials", { email, password })`, NextAuth internally:
> 1. POSTs to `/api/auth/callback/credentials`
> 2. Runs your `authorize()` function from `src/lib/auth.ts`
> 3. Creates the JWT and sets the cookie
>
> You only need to call `signIn()` from the UI — which is shown in Section 10.

---

## 9. Registration Forms (UI)

> **What is a component?** A component is a reusable piece of UI. Instead of writing the same form HTML in multiple places, you write it once as a component (a `.tsx` file that returns JSX) and import it wherever needed.
>
> **What is JSX?** JSX is HTML-like syntax you write inside TypeScript/JavaScript. React converts it into actual browser DOM elements. For example:
> ```tsx
> // JSX
> <button className="bg-blue-500 text-white">Click me</button>
>
> // What React turns it into (simplified)
> React.createElement("button", { className: "bg-blue-500 text-white" }, "Click me")
> ```

### 9.1 Registration landing page (`src/app/(auth)/register/page.tsx`)

First, create the folder: `src/app/(auth)/register/`

Then create `page.tsx`:

```tsx
import Link from "next/link";

// This is a Server Component (no "use client" at the top)
// It runs on the server and sends HTML to the browser — good for simple pages
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Join Katuwang</h1>
          <p className="mt-2 text-gray-600">
            Select your role to get started.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/register/learner"
            className="block w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            I need tutoring help
            <span className="block text-sm font-normal opacity-80 mt-1">
              Register as a Student Learner
            </span>
          </Link>

          <Link
            href="/register/tutor"
            className="block w-full py-4 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            I want to tutor others
            <span className="block text-sm font-normal opacity-80 mt-1">
              Register as a Student Tutor
            </span>
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 9.2 Learner registration page (`src/app/(auth)/register/learner/page.tsx`)

```tsx
import LearnerRegisterForm from "@/components/auth/LearnerRegisterForm";

export default function LearnerRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Student Learner Registration
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Create your free Katuwang account to find a peer tutor.
          </p>
        </div>
        <LearnerRegisterForm />
      </div>
    </div>
  );
}
```

### 9.3 Learner form component (`src/components/auth/LearnerRegisterForm.tsx`)

> **Why `"use client"` at the top?** React components are Server Components by default in Next.js — they run on the server and can't respond to user interactions. Adding `"use client"` makes it a Client Component, which runs in the browser and can use React hooks like `useState` for managing form input.

Create the folder `src/components/auth/`, then create `LearnerRegisterForm.tsx`:

```tsx
"use client";
// This directive is required because we use useState and event handlers

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADE_LEVELS = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

export default function LearnerRegisterForm() {
  const router = useRouter();
  // useRouter lets us redirect to another page programmatically

  const [loading, setLoading] = useState(false);
  // loading = true while the fetch request is in progress
  // We use this to disable the submit button so the user doesn't submit twice

  const [error, setError] = useState("");
  // Stores any error message to display to the user

  // All form field values stored in one state object
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "",
    section: "",
    contactInfo: "",
    consentGiven: false,
  });

  // Generic change handler — works for both text inputs and checkboxes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    // For checkboxes, use target.checked; for everything else use target.value
    const value = target.type === "checkbox" ? target.checked : target.value;
    // Update only the field that changed, keep everything else the same
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  // Called when the form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // e.preventDefault() stops the browser from reloading the page on submit
    // (the default HTML form behavior — we want to handle it ourselves)

    setError(""); // Clear any previous errors

    // Client-side validation before sending to the server
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // Send the form data to our API route
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEARNER", ...form }),
        // JSON.stringify converts the JavaScript object to a JSON string
        // { type: "LEARNER", ...form } spreads all form fields into the object
      });

      const data = await res.json();
      // Parse the JSON response from the server

      if (!res.ok) {
        // res.ok is true for HTTP 200-299, false for errors (400, 409, 500, etc.)
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Success — redirect to login page with the new anonymous ID in the URL
      router.push(
        `/login?registered=true&id=${encodeURIComponent(data.anonymousId)}`
      );
    } catch {
      // This catches network errors (e.g., no internet connection)
      setError("A network error occurred. Please check your connection.");
    } finally {
      // This always runs — whether the request succeeded or failed
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      {/* Show error message if there is one */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"           // Must match the key in the form state object
          value={form.fullName}     // Controlled input — value comes from state
          onChange={handleChange}   // Updates state on every keystroke
          required
          placeholder="Your full name (kept private)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grade Level & Section side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level <span className="text-red-500">*</span>
          </label>
          <select
            name="gradeLevel"
            value={form.gradeLevel}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select grade</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="section"
            value={form.section}
            onChange={handleChange}
            required
            placeholder="e.g., Rizal"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Info <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="Phone or guardian contact"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Repeat your password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Consent Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <input
          type="checkbox"
          name="consentGiven"
          id="consent"
          checked={form.consentGiven}
          onChange={handleChange}
          required
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="consent" className="text-sm text-gray-700">
          I confirm that a parent or guardian has consented to this
          registration. Personal information collected is used solely for
          academic support purposes in accordance with RA 10173 (Data Privacy
          Act of 2012). <span className="text-red-500">*</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Creating account..." : "Create Learner Account"}
      </button>
    </form>
  );
}
```

### 9.4 Tutor registration page (`src/app/(auth)/register/tutor/page.tsx`)

```tsx
import TutorRegisterForm from "@/components/auth/TutorRegisterForm";

export default function TutorRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Student Tutor Registration
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Register to volunteer as a peer tutor. You will take a qualifying
            assessment for each subject you select.
          </p>
        </div>
        <TutorRegisterForm />
      </div>
    </div>
  );
}
```

### 9.5 Tutor form component (`src/components/auth/TutorRegisterForm.tsx`)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADE_LEVELS = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const SUBJECTS = [
  { value: "MATH", label: "Mathematics" },
  { value: "ENGLISH", label: "English" },
  { value: "SCIENCE", label: "Science" },
  { value: "FILIPINO", label: "Filipino" },
  { value: "ARALING_PANLIPUNAN", label: "Araling Panlipunan" },
  { value: "TLE", label: "TLE" },
  { value: "MAPEH", label: "MAPEH" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type AvailabilitySlot = {
  day: string;
  startTime: string;
  endTime: string;
};

export default function TutorRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "",
    section: "",
    contactInfo: "",
    consentGiven: false,
  });

  // Separate state for multi-select subjects
  // We use an array of strings: ["MATH", "ENGLISH", ...]
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Separate state for availability slots
  // Start with one empty slot so the form isn't blank
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { day: "", startTime: "", endTime: "" },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  // Toggle a subject on/off in the selectedSubjects array
  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject) // Remove if already selected
        : [...prev, subject]                 // Add if not selected
    );
  };

  // Add a new blank availability slot
  const addAvailabilitySlot = () => {
    setAvailability((prev) => [
      ...prev,
      { day: "", startTime: "", endTime: "" },
    ]);
  };

  // Update one field in one availability slot
  const updateAvailabilitySlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string
  ) => {
    setAvailability((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    );
  };

  // Remove an availability slot by its index
  const removeAvailabilitySlot = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject you want to tutor.");
      return;
    }

    // Filter out any incomplete availability slots before sending
    const validSlots = availability.filter(
      (s) => s.day && s.startTime && s.endTime
    );

    if (validSlots.length === 0) {
      setError("Please add at least one complete availability slot.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TUTOR",
          ...form,
          subjects: selectedSubjects,
          availability: validSlots,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push(
        `/login?registered=true&id=${encodeURIComponent(data.anonymousId)}&role=tutor`
      );
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Grade Level & Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level <span className="text-red-500">*</span>
          </label>
          <select name="gradeLevel" value={form.gradeLevel} onChange={handleChange} required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select grade</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <input type="text" name="section" value={form.section} onChange={handleChange} required
            placeholder="e.g., Rizal"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      {/* Subject Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subjects you want to tutor <span className="text-red-500">*</span>
          <span className="block text-xs text-gray-400 font-normal mt-1">
            Select all that apply. You will take one qualifying exam per subject.
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.value}
              type="button"
              onClick={() => toggleSubject(subject.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                selectedSubjects.includes(subject.value)
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-green-400"
              }`}
            >
              {subject.label}
            </button>
          ))}
        </div>
        {selectedSubjects.length > 0 && (
          <p className="mt-2 text-xs text-green-700">
            ✓ Selected: {selectedSubjects.join(", ")}
          </p>
        )}
      </div>

      {/* Availability Slots */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability Schedule <span className="text-red-500">*</span>
          <span className="block text-xs text-gray-400 font-normal mt-1">
            When are you free to tutor? Add as many slots as needed.
          </span>
        </label>
        <div className="space-y-2">
          {availability.map((slot, index) => (
            <div key={index} className="flex gap-2 items-center flex-wrap">
              <select
                value={slot.day}
                onChange={(e) => updateAvailabilitySlot(index, "day", e.target.value)}
                className="flex-1 min-w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <input type="time" value={slot.startTime}
                onChange={(e) => updateAvailabilitySlot(index, "startTime", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />

              <span className="text-gray-400 text-sm">to</span>

              <input type="time" value={slot.endTime}
                onChange={(e) => updateAvailabilitySlot(index, "endTime", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />

              {availability.length > 1 && (
                <button type="button" onClick={() => removeAvailabilitySlot(index)}
                  className="text-red-400 hover:text-red-600 text-lg px-1">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addAvailabilitySlot}
          className="mt-2 text-sm text-green-600 hover:underline">
          + Add another time slot
        </button>
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Info <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input type="text" name="contactInfo" value={form.contactInfo} onChange={handleChange}
          placeholder="Phone or guardian contact"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input type="password" name="password" value={form.password} onChange={handleChange}
          required minLength={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Consent */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
        <input type="checkbox" name="consentGiven" id="consent" checked={form.consentGiven}
          onChange={handleChange} required
          className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded" />
        <label htmlFor="consent" className="text-sm text-gray-700">
          I confirm that a parent or guardian has consented to this registration.
          Personal information collected is used solely for academic support purposes
          in accordance with RA 10173 (Data Privacy Act of 2012).{" "}
          <span className="text-red-500">*</span>
        </label>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
        {loading ? "Creating account..." : "Create Tutor Account"}
      </button>
    </form>
  );
}
```

---

## 10. Login Form (UI)

### 10.1 Login page (`src/app/(auth)/login/page.tsx`)

Create the folder `src/app/(auth)/login/`, then create `page.tsx`:

```tsx
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Katuwang</h1>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

### 10.2 Login form component (`src/components/auth/LoginForm.tsx`)

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
// signIn() is NextAuth's client-side function that triggers the login flow
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  // useSearchParams reads the URL query string: /login?registered=true&id=STU-0001

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({ email: "", password: "" });

  // When the page loads, check if we just came from registration
  useEffect(() => {
    if (params.get("registered") === "true") {
      const id = params.get("id");
      const role = params.get("role");
      if (role === "tutor") {
        setSuccessMsg(
          `Account created! Your tutor ID is ${id}. Log in below — you'll be prompted to take your qualifying assessment(s) before being matched with learners.`
        );
      } else {
        setSuccessMsg(
          `Account created! Your learner ID is ${id}. Log in below to start requesting tutoring sessions.`
        );
      }
    }
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call NextAuth's signIn function
    // redirect: false means we handle the redirect ourselves
    // instead of NextAuth doing a full page reload
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // result.error contains the message thrown in authorize()
      setError(result.error);
      return;
    }

    // Login successful — go to dashboard (which will redirect based on role)
    router.push("/dashboard");
    router.refresh();
    // router.refresh() tells Next.js to re-fetch the current page's server data
    // This ensures the session is picked up by server components immediately
  };

  return (
    <form onSubmit={handleSubmit}
      className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

      {/* Registration success message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* Login error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function LoginForm() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 text-sm">Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
```

---

## 11. Middleware — Route Protection

> **What is middleware and why is it important?**
>
> Middleware is code that runs before Next.js renders any page. It's your security gate. Without it, someone could simply type `http://localhost:3000/admin` in the browser and potentially access the admin page even if they're not an admin.
>
> The middleware reads the user's JWT cookie, checks their role, and redirects them away from pages they're not allowed to see — before the page even starts loading.
>
> **Important:** Hiding a button or link in the UI is NOT security. A user can navigate directly via URL. Always enforce access at the middleware level.

Create `src/middleware.ts` (at the `src/` level, not inside `app/`):

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This function runs on every matched request
  function middleware(req) {
    const { token } = req.nextauth;
    // token = the decoded JWT. Contains id, role, anonymousId, etc.
    // If the user is not logged in, token will be null

    const pathname = req.nextUrl.pathname;
    // pathname = the URL path being requested, e.g., "/admin/users"

    // ── Admin-only routes ──────────────────────────────────────────────────
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // ── Teacher Moderator routes (Admins can also access) ──────────────────
    if (
      pathname.startsWith("/moderator") &&
      token?.role !== "TEACHER_MODERATOR" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // ── Tutor-only routes ──────────────────────────────────────────────────
    if (pathname.startsWith("/tutor") && token?.role !== "STUDENT_TUTOR") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // ── Learner-only routes ────────────────────────────────────────────────
    if (pathname.startsWith("/learner") && token?.role !== "STUDENT_LEARNER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // If all checks pass, allow the request through
    return NextResponse.next();
  },
  {
    callbacks: {
      // This runs first. If it returns false, the user is redirected to the
      // login page. We return true only if a token exists (user is logged in).
      authorized: ({ token }) => !!token,
    },
  }
);

// Tell Next.js which routes this middleware applies to
// It will NOT run on public routes like /login, /register, /api/register
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/moderator/:path*",
    "/tutor/:path*",
    "/learner/:path*",
  ],
};
```

---

## 12. Role-Based Access Control (RBAC)

### 12.1 Role-based dashboard redirect (`src/app/dashboard/page.tsx`)

> After a successful login, every user goes to `/dashboard`. This server component reads their session role and immediately redirects them to their own area. They never actually see the dashboard page itself.

Create the folder `src/app/dashboard/`, then create `page.tsx`:

```tsx
import { getServerSession } from "next-auth";
// getServerSession reads the JWT cookie on the server — use this in server components

import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
    // redirect() in a server component stops execution and sends the browser to /login
  }

  // Map each role to its dedicated area
  const roleRedirects: Record<string, string> = {
    ADMIN: "/admin",
    TEACHER_MODERATOR: "/moderator",
    STUDENT_TUTOR: "/tutor",
    STUDENT_LEARNER: "/learner",
  };

  const destination = roleRedirects[session.user.role];
  redirect(destination ?? "/login");
}
```

### 12.2 Checking the session in a server component

> Use `getServerSession` in any page or layout that runs on the server (no `"use client"` at the top):

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TutorHomePage() {
  const session = await getServerSession(authOptions);

  // session.user contains: id, anonymousId, email, role, fullName
  return (
    <div>
      <h1>Welcome, {session?.user.anonymousId}</h1>
      {/* Shows "TUT-0001" — the anonymous ID, never the real name */}
    </div>
  );
}
```

### 12.3 Checking the session in a client component

> Use `useSession` hook in components that have `"use client"` at the top:

```tsx
"use client";

import { useSession } from "next-auth/react";

export default function ProfileBadge() {
  const { data: session, status } = useSession();
  // status: "loading" | "authenticated" | "unauthenticated"

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthenticated") return null;

  return (
    <div className="text-sm text-gray-600">
      Logged in as <strong>{session!.user.anonymousId}</strong>
      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
        {session!.user.role}
      </span>
    </div>
  );
}
```

### 12.4 Wrap your app with the SessionProvider

> `useSession` only works if your app is wrapped in `SessionProvider`. Add this to your root layout.

Create or edit `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Katuwang",
  description: "Peer Tutoring Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

Create `src/app/SessionProvider.tsx`:

```tsx
"use client";
// SessionProvider must be a client component

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
```

---

## 13. Anonymized ID Generation

The `generateAnonymousId()` function uses a **database-backed atomic counter** to prevent duplicate IDs even under simultaneous registrations.

**How the counter works step by step:**

```
Initial state in id_counters table:
  role: "TUTOR",   count: 0
  role: "LEARNER", count: 0

First learner registers:
  UPDATE id_counters SET count = count + 1 WHERE role = "LEARNER"
  → count becomes 1
  → padStart(4, "0") → "0001"
  → ID: "STU-0001"

Second learner registers:
  → count becomes 2 → "STU-0002"

First tutor registers:
  UPDATE id_counters SET count = count + 1 WHERE role = "TUTOR"
  → count becomes 1 (separate counter!)
  → ID: "TUT-0001"
```

**Why atomic increment?** If two students register at the exact same millisecond and both read `count = 5`, they'd both try to become `STU-0006` — a duplicate. Using MySQL's `count + 1` increment, the database handles this safely — one gets 6, the other gets 7, with no duplicates.

---

## 14. Data Privacy Compliance Notes

Per **RA 10173 (Data Privacy Act of 2012)** and the principle of **Data Minimization**:

| Requirement | How it's implemented |
|---|---|
| Collect only necessary data | No social profile, no photo, no unnecessary identifiers |
| Anonymize student identity | `anonymousId` is what's shown publicly — never the real name |
| Protect passwords | bcrypt with cost factor 12 — never stored or logged in plaintext |
| Consent for minors | `consentGiven` checkbox required, stored in database |
| HTTPS only | Enforce in production via hosting provider SSL certificate |
| No unauthorized access | RBAC enforced at middleware level before any page renders |
| Right to access | Admin can retrieve and export a user's own data on request |

---

## 15. Testing Checklist

Before marking Sprint 1 as done, manually verify each of the following:

### Registration — Student Learner
- [ ] Fill all required fields → clicks submit → `STU-0001` shown on redirect to login
- [ ] Register a second learner → gets `STU-0002` (sequential increment)
- [ ] Submit with missing `fullName` → error message shown, no account created
- [ ] Submit with existing email → "already exists" error shown
- [ ] Uncheck consent checkbox → error shown, no account created
- [ ] Passwords that don't match → error shown before sending to server
- [ ] Check database: password column contains a `$2b$...` bcrypt hash, not plaintext

### Registration — Student Tutor
- [ ] Select multiple subjects + fill form → `TUT-0001` shown on redirect
- [ ] Database: one `subject_applications` row per selected subject, all `certified: false`
- [ ] Database: `tutor_profiles` row created with `status: PENDING`
- [ ] Submit with zero subjects selected → error shown
- [ ] Submit with no availability slots → error shown

### Login
- [ ] Correct email + password → session created, redirected to `/dashboard`
- [ ] `/dashboard` immediately redirects learner to `/learner`, tutor to `/tutor`
- [ ] Wrong password → "Incorrect password" error shown, no session created
- [ ] Non-existent email → "No account found" error shown
- [ ] Close and reopen browser → session still valid (within 8 hours)

### RBAC / Middleware
- [ ] Logged-out user visits `/dashboard` → redirected to `/login`
- [ ] Logged-in learner manually visits `/admin` → redirected to `/unauthorized`
- [ ] Logged-in tutor manually visits `/learner` → redirected to `/unauthorized`
- [ ] Logged-in admin visits `/admin` → access granted

### Anonymization
- [ ] Real name (`fullName`) does not appear anywhere in the UI (only in the database)
- [ ] Only `anonymousId` (`TUT-XXXX` / `STU-XXXX`) is shown in user-facing components

---

# Part 2 — Troubleshooting & Common Mistakes

---

## Common Errors and Fixes

### ❌ `PrismaClientKnownRequestError: connect ECONNREFUSED`
**Cause:** MySQL is not running, or your `DATABASE_URL` is wrong.

**Fix:**
1. Start MySQL: on Windows search "Services" and start MySQL; on Mac run `brew services start mysql`
2. Double-check your `DATABASE_URL` in `.env.local` — password, port (3306), and database name

---

### ❌ `[next-auth][error][NEXTAUTH_URL]` in the console
**Cause:** `NEXTAUTH_URL` is missing from `.env.local`

**Fix:** Make sure your `.env.local` has:
```env
NEXTAUTH_URL="http://localhost:3000"
```
Then restart the dev server (`Ctrl + C`, then `npm run dev`).

---

### ❌ `Error: NEXTAUTH_SECRET is not set`
**Cause:** The secret is missing or `.env.local` was not loaded.

**Fix:**
1. Make sure `.env.local` exists in the root folder (same level as `package.json`)
2. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
3. Paste the result as the value of `NEXTAUTH_SECRET`
4. Restart the dev server

---

### ❌ `Cannot find module '@/lib/prisma'`
**Cause:** The `@/` alias isn't configured, or the file doesn't exist yet.

**Fix:**
1. Make sure `src/lib/prisma.ts` exists
2. Check `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` — `create-next-app` adds this automatically

---

### ❌ `useSession must be wrapped in a SessionProvider`
**Cause:** `SessionProvider` is missing from the root layout.

**Fix:** Make sure `src/app/layout.tsx` wraps `{children}` in the `<SessionProvider>` from Section 12.4.

---

### ❌ Registration succeeds but ID counter didn't seed
**Cause:** The `prisma/seed.ts` was never run, so there are no rows in `id_counters`.

**Fix:**
```bash
npx prisma db seed
```

---

### ❌ `useSearchParams() should be wrapped in a suspense boundary`
**Cause:** Next.js requires `useSearchParams` to be inside a `<Suspense>` component.

**Fix:** The `LoginForm` component in Section 10.2 already handles this by splitting into `LoginFormInner` (uses `useSearchParams`) and a wrapper `LoginForm` that wraps it in `<Suspense>`. Make sure you copied the full version.

---

### ❌ Tailwind classes not working (no styles applied)
**Cause:** Tailwind isn't processing the files, or `globals.css` doesn't import Tailwind.

**Fix:** Make sure `src/app/globals.css` contains:
```css
@import "tailwindcss";
```
For Tailwind CSS v4 (which your project uses), that single line is all you need.

---

### ❌ Changes to `.env.local` not taking effect
**Cause:** Next.js only reads environment variables at startup.

**Fix:** Every time you change `.env.local`, stop and restart the dev server:
```bash
# Stop: Ctrl + C
npm run dev
```

---

*This guide covers Sprint 1 — User Management & Access Control. Next: Sprint 2 — Tutor Matching Module.*
DOCEOF
