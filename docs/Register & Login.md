# Katuwang — Registration & Login Implementation Guide

> **Stack:** Next.js 16.2.4 · React 19 · TypeScript · Tailwind CSS 4 · NextAuth.js 4.24.14 · Prisma 7.7.0 · MySQL 9.7.0 · bcrypt

---

## Table of Contents

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

```
katuwang/
├── prisma/
│   └── schema.prisma          # Database models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth handler
│   │   │   └── register/
│   │   │       └── route.ts       # Registration API
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   └── register/
│   │   │       ├── learner/
│   │   │       │   └── page.tsx   # Learner registration
│   │   │       └── tutor/
│   │   │           └── page.tsx   # Tutor registration
│   │   └── dashboard/
│   │       └── page.tsx           # Role-based redirect target
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── LearnerRegisterForm.tsx
│   │       └── TutorRegisterForm.tsx
│   ├── lib/
│   │   ├── auth.ts                # NextAuth options (shared config)
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── idGenerator.ts         # TUT-XXXX / STU-XXXX generator
│   ├── middleware.ts              # Route protection
│   └── types/
│       └── next-auth.d.ts         # Extended session types
├── .env.local
└── next.config.ts
```

---

## 3. Database Schema

### 3.1 Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────────────────────

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

// ─── User ────────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  anonymousId   String    @unique   // TUT-0001 or STU-0001
  fullName      String
  email         String    @unique
  password      String                  // bcrypt hash
  role          Role
  gradeLevel    GradeLevel
  section       String
  contactInfo   String?
  consentGiven  Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Tutor-specific
  tutorProfile  TutorProfile?

  // Relations
  sessions      Session[]
  assessments   Assessment[]

  @@map("users")
}

// ─── Tutor Profile ────────────────────────────────────────────────────────────

model TutorProfile {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])
  status          TutorStatus @default(PENDING)
  
  // Subjects the tutor applied for (multi-select at registration)
  appliedSubjects SubjectApplication[]
  
  // Availability schedule (stored as JSON: [{day, startTime, endTime}])
  availability    Json

  @@map("tutor_profiles")
}

// ─── Subject Application (per-subject certification tracking) ─────────────────

model SubjectApplication {
  id              String      @id @default(cuid())
  tutorProfileId  String
  tutorProfile    TutorProfile @relation(fields: [tutorProfileId], references: [id])
  subject         SubjectArea
  certified       Boolean     @default(false)
  attemptedAt     DateTime?
  certifiedAt     DateTime?

  @@unique([tutorProfileId, subject])
  @@map("subject_applications")
}

// ─── ID Counter (for sequential anonymous IDs) ────────────────────────────────

model IdCounter {
  role    String  @id  // "TUTOR" or "LEARNER"
  count   Int     @default(0)

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

### 4.3 Push schema to MySQL

```bash
npx prisma db push
```

### 4.4 Seed the ID counters

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Initialize counters for both roles
  await prisma.idCounter.upsert({
    where: { role: "TUTOR" },
    update: {},
    create: { role: "TUTOR", count: 0 },
  });

  await prisma.idCounter.upsert({
    where: { role: "LEARNER" },
    update: {},
    create: { role: "LEARNER", count: 0 },
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the seed:

```bash
npx prisma db seed
```

### 4.5 Prisma client singleton (`src/lib/prisma.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 5. Environment Variables

Create `.env.local` in your project root:

```env
# Database
DATABASE_URL="mysql://root:your_password@localhost:3306/katuwang_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-strong-secret-here"
# Generate with: openssl rand -base64 32
```

> **Never commit `.env.local` to version control.** Add it to `.gitignore`.

---

## 6. NextAuth.js Configuration

### 6.1 Extend session types (`src/types/next-auth.d.ts`)

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId: string;
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with that email.");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password.");
        }

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
    async jwt({ token, user }) {
      // On sign in, attach user data to the JWT
      if (user) {
        token.id = user.id;
        token.anonymousId = user.anonymousId;
        token.role = user.role;
        token.fullName = user.fullName;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose safe user data to the client session
      if (token) {
        session.user.id = token.id;
        session.user.anonymousId = token.anonymousId;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",           // Custom login page
    error: "/login",            // Redirect auth errors to login page
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,       // 8 hours (school-day-length sessions)
  },

  secret: process.env.NEXTAUTH_SECRET,
};
```

### 6.3 NextAuth route handler (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 7. Registration API Route

### 7.1 Anonymized ID generator (`src/lib/idGenerator.ts`)

```typescript
import { prisma } from "./prisma";

/**
 * Generates the next sequential anonymous ID for a given role.
 * TUT-0001, TUT-0002 ... for tutors
 * STU-0001, STU-0002 ... for learners
 *
 * Uses a DB transaction to prevent race conditions.
 */
export async function generateAnonymousId(
  role: "TUTOR" | "LEARNER"
): Promise<string> {
  const prefix = role === "TUTOR" ? "TUT" : "STU";

  const updated = await prisma.idCounter.update({
    where: { role },
    data: { count: { increment: 1 } },
  });

  const padded = String(updated.count).padStart(4, "0");
  return `${prefix}-${padded}`;
}
```

### 7.2 Registration route (`src/app/api/register/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";
import { Role, GradeLevel, SubjectArea } from "@prisma/client";

// ─── Learner Registration ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
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
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Learner ──────────────────────────────────────────────────────────────────

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

  // Validate required fields
  if (!fullName || !email || !password || !gradeLevel || !section) {
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

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate anonymous ID
  const anonymousId = await generateAnonymousId("LEARNER");

  // Create user
  const user = await prisma.user.create({
    data: {
      anonymousId,
      fullName,
      email,
      password: hashedPassword,
      role: Role.STUDENT_LEARNER,
      gradeLevel: gradeLevel as GradeLevel,
      section,
      contactInfo: contactInfo ?? null,
      consentGiven,
    },
    select: {
      anonymousId: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json(
    {
      message: "Registration successful.",
      anonymousId: user.anonymousId,
    },
    { status: 201 }
  );
}

// ─── Tutor ────────────────────────────────────────────────────────────────────

async function registerTutor(body: any) {
  const {
    fullName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    subjects,        // string[] — multi-select from SubjectArea enum
    availability,    // [{ day: string, startTime: string, endTime: string }]
    consentGiven,
  } = body;

  // Validate required fields
  if (
    !fullName ||
    !email ||
    !password ||
    !gradeLevel ||
    !section ||
    !subjects ||
    subjects.length === 0 ||
    !availability ||
    availability.length === 0
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

  // Validate subjects are valid enum values
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

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate anonymous ID
  const anonymousId = await generateAnonymousId("TUTOR");

  // Create user + tutor profile + subject applications in a transaction
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

NextAuth's `CredentialsProvider` (configured in Section 6.2) handles login at `/api/auth/callback/credentials` automatically. You do **not** need a separate login API route.

Login is invoked from the UI using NextAuth's `signIn()` function:

```typescript
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
  email,
  password,
  redirect: false,   // handle redirect manually after checking result
});
```

---

## 9. Registration Forms (UI)

### 9.1 Registration landing page (`src/app/(auth)/register/page.tsx`)

Let the user choose which type of account to create:

```tsx
import Link from "next/link";

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

### 9.2 Learner registration form (`src/components/auth/LearnerRegisterForm.tsx`)

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

export default function LearnerRegisterForm() {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
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

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEARNER", ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Redirect to login with success message
      router.push(
        `/login?registered=true&id=${encodeURIComponent(data.anonymousId)}`
      );
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
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

      {/* Grade Level & Section */}
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
          Contact Info{" "}
          <span className="text-gray-400 text-xs">(optional)</span>
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

### 9.3 Tutor registration form (`src/components/auth/TutorRegisterForm.tsx`)

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

  // Multi-select subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Availability slots
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

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const addAvailabilitySlot = () => {
    setAvailability((prev) => [...prev, { day: "", startTime: "", endTime: "" }]);
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string
  ) => {
    setAvailability((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

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

    const validSlots = availability.filter(
      (s) => s.day && s.startTime && s.endTime
    );
    if (validSlots.length === 0) {
      setError("Please add at least one availability slot.");
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
    <form onSubmit={handleSubmit} className="space-y-5">
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
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Grade Level & Section */}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Subjects — Multi-select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subjects you want to tutor{" "}
          <span className="text-red-500">*</span>
          <span className="text-gray-400 text-xs ml-2">
            (select all that apply — you'll take one qualifying exam per subject)
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
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability Schedule <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {availability.map((slot, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={slot.day}
                onChange={(e) =>
                  updateAvailabilitySlot(index, "day", e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  updateAvailabilitySlot(index, "startTime", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <span className="text-gray-400 text-sm">to</span>

              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  updateAvailabilitySlot(index, "endTime", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {availability.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAvailabilitySlot(index)}
                  className="text-red-400 hover:text-red-600 text-sm px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addAvailabilitySlot}
          className="mt-2 text-sm text-green-600 hover:underline"
        >
          + Add another time slot
        </button>
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Info{" "}
          <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="Phone or guardian contact"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Consent */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
        <input
          type="checkbox"
          name="consentGiven"
          id="consent"
          checked={form.consentGiven}
          onChange={handleChange}
          required
          className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
        />
        <label htmlFor="consent" className="text-sm text-gray-700">
          I confirm that a parent or guardian has consented to this
          registration. Personal information collected is used solely for
          academic support purposes in accordance with RA 10173 (Data Privacy
          Act of 2012). <span className="text-red-500">*</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Creating account..." : "Create Tutor Account"}
      </button>
    </form>
  );
}
```

---

## 10. Login Form (UI)

### 10.1 Login page (`src/app/(auth)/login/page.tsx`)

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

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({ email: "", password: "" });

  // Show success message from registration redirect
  useEffect(() => {
    if (params.get("registered") === "true") {
      const id = params.get("id");
      const role = params.get("role");
      if (role === "tutor") {
        setSuccessMsg(
          `Account created! Your tutor ID is ${id}. Please log in — you'll be prompted to take your qualifying assessment(s) before being matched with learners.`
        );
      } else {
        setSuccessMsg(
          `Account created! Your learner ID is ${id}. Please log in to start requesting tutoring sessions.`
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

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Redirect based on role — NextAuth session already has role attached
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

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
```

---

## 11. Middleware — Route Protection

`src/middleware.ts` intercepts every request and enforces authentication before any protected page is served.

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const pathname = req.nextUrl.pathname;

    // Role-based route guards
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/moderator") &&
      token?.role !== "TEACHER_MODERATOR" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/tutor") &&
      token?.role !== "STUDENT_TUTOR"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      pathname.startsWith("/learner") &&
      token?.role !== "STUDENT_LEARNER"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,  // Must be authenticated
    },
  }
);

// Apply middleware to these routes
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

After login, every user lands on `/dashboard`, which redirects them to their own role-specific area:

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

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

### 12.2 Checking the session in any server component

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SomePage() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  return (
    <div>
      <p>Welcome, {session.user.anonymousId}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### 12.3 Checking the session in a client component

```tsx
"use client";

import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>Not signed in.</p>;

  return (
    <div>
      <p>{session.user.anonymousId}</p>
      <p>{session.user.role}</p>
    </div>
  );
}
```

---

## 13. Anonymized ID Generation

The `generateAnonymousId()` function in `src/lib/idGenerator.ts` (Section 7.1) uses a **database-backed counter** with Prisma's `increment` operation. This prevents duplicate IDs even if two users register at the exact same millisecond, because MySQL handles the atomic increment at the database level.

**How the counter works:**

```
First learner registers  → count: 0 + 1 = 1  → STU-0001
Second learner registers → count: 1 + 1 = 2  → STU-0002
First tutor registers    → count: 0 + 1 = 1  → TUT-0001  (separate counter)
```

The counters for `TUTOR` and `LEARNER` are **independent**, so TUT-0001 and STU-0001 can coexist.

---

## 14. Data Privacy Compliance Notes

Per **RA 10173 (Data Privacy Act of 2012)** and the principle of **Data Minimization**:

| Practice | How it's implemented here |
|---|---|
| Collect only necessary data | No social profile, no photo upload, no unnecessary identifiers |
| Anonymize student identity | `anonymousId` (`TUT-XXXX`/`STU-XXXX`) is what's shown to others — never the real name |
| Protect passwords | bcrypt with cost factor 12 — never stored or logged in plaintext |
| Consent for minors | `consentGiven` checkbox is required and stored in the DB |
| HTTPS only | Enforce in production via Next.js config and hosting provider (Vercel / server SSL) |
| No unauthorized access | RBAC enforced at middleware level before any page is rendered |

---

## 15. Testing Checklist

Before marking Sprint 1 as done, verify each of the following:

### Registration
- [ ] Learner can register with all required fields → `STU-XXXX` ID generated correctly
- [ ] Tutor can register with multiple subjects selected → `TUT-XXXX` ID generated, one `SubjectApplication` row per subject
- [ ] Duplicate email is rejected with a clear error message
- [ ] Missing required fields are rejected with a clear error message
- [ ] `consentGiven = false` is rejected
- [ ] Password is stored as a bcrypt hash (never plaintext — check DB directly)
- [ ] Sequential IDs increment correctly across multiple registrations
- [ ] Tutor and learner counters are independent (TUT-0001 ≠ STU-0001 clash)

### Login
- [ ] Correct credentials → user is authenticated, JWT issued, redirected to `/dashboard`
- [ ] Wrong password → clear error shown, no session created
- [ ] Non-existent email → clear error shown
- [ ] Session expires after 8 hours

### RBAC
- [ ] Admin visiting `/admin` → allowed
- [ ] Learner visiting `/admin` → redirected to `/unauthorized`
- [ ] Tutor visiting `/learner` → redirected to `/unauthorized`
- [ ] Unauthenticated user visiting `/dashboard` → redirected to `/login`

### Anonymization
- [ ] Real name (`fullName`) is never surfaced in any public-facing component
- [ ] Only `anonymousId` is shown in tutor/learner-facing views

---

*This guide covers Sprint 1 (User Management & Access Control). Next steps: Sprint 2 — Tutor Matching Module.*
