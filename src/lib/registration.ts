import bcrypt from "bcryptjs";
import { GradeLevel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";
import { generateVerificationToken, hashVerificationToken, verificationTokenExpiry } from "@/lib/emailVerification";

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
  /** When true, a VerificationToken is issued and its raw value returned for the caller to email. */
  requireEmailVerification?: boolean;
};

export type RegisterAccountResult =
  | {
      ok: true;
      anonymousId: string;
      role: Role;
      pendingApproval: boolean;
      /** Raw (unhashed) verification token — only the caller ever sees this, to put in the emailed link. */
      verificationToken: string | null;
    }
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
    requireEmailVerification = false,
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
  const select = { id: true, anonymousId: true, email: true, role: true } as const;

  const rawVerificationToken = requireEmailVerification ? generateVerificationToken() : null;
  const createData = isTutor ? { ...data, tutorProfile: { create: {} } } : data;

  // Only reach for a transaction when there's more than one table to write —
  // a plain learner signup with no verification stays a single insert.
  const user =
    isTutor || rawVerificationToken
      ? await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({ data: createData, select });

          if (rawVerificationToken) {
            await tx.verificationToken.create({
              data: {
                userId: created.id,
                tokenHash: hashVerificationToken(rawVerificationToken),
                expiresAt: verificationTokenExpiry(),
              },
            });
          }

          return created;
        })
      : await prisma.user.create({ data: createData, select });

  return {
    ok: true,
    anonymousId: user.anonymousId,
    role: user.role,
    pendingApproval: requireApproval,
    verificationToken: rawVerificationToken,
  };
}
