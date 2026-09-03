import bcrypt from "bcryptjs";
import { GradeLevel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";

// ─────────────────────────────────────────────────────────────────────────────
// Shared account-registration core. This is the single place that turns a set
// of validated registration fields into a real User row (plus a TutorProfile
// for tutors) — used by the public /api/register route AND the dev data
// factory, so throwaway accounts are created exactly the way a real signup is.
// ─────────────────────────────────────────────────────────────────────────────

export type RegisterAccountInput = {
  type: "LEARNER" | "TUTOR";
  firstName: string;
  lastName: string;
  email: string;
  /** Plaintext — hashed inside this function. */
  password: string;
  gradeLevel: GradeLevel;
  section: string;
  contactInfo?: string | null;
  consentGiven: boolean;
  /** When true, the account is created with status PENDING (awaiting admin approval). */
  requireApproval?: boolean;
};

export type RegisterAccountResult =
  | { ok: true; anonymousId: string; role: Role; pendingApproval: boolean }
  | { ok: false; code: "DUPLICATE_EMAIL" };

export async function registerAccount(input: RegisterAccountInput): Promise<RegisterAccountResult> {
  const {
    type,
    firstName,
    lastName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    consentGiven,
    requireApproval = false,
  } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: "DUPLICATE_EMAIL" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const isTutor = type === "TUTOR";
  const anonymousId = await generateAnonymousId(isTutor ? "TUTOR" : "LEARNER");

  const data = {
    anonymousId,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: isTutor ? Role.STUDENT_TUTOR : Role.STUDENT_LEARNER,
    gradeLevel,
    section,
    contactInfo: contactInfo || null,
    consentGiven,
    ...(requireApproval ? { status: "PENDING" as const } : {}),
  };
  const select = { anonymousId: true, email: true, role: true } as const;

  const user = isTutor
    ? // Mirror the public route: user + tutor profile in one transaction.
      await prisma.$transaction(async (tx) =>
        tx.user.create({ data: { ...data, tutorProfile: { create: {} } }, select }),
      )
    : await prisma.user.create({ data, select });

  return {
    ok: true,
    anonymousId: user.anonymousId,
    role: user.role,
    pendingApproval: requireApproval,
  };
}
