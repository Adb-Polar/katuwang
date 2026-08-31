import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";
import { Role } from "@prisma/client";
import { registerSchema, LearnerRegisterInput, TutorRegisterInput } from "@/lib/validations/auth";
import { getSetting } from "@/lib/settings";

// ─── Registration Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const registrationOpen = await getSetting("registrationOpen");
    if (!registrationOpen) {
      return NextResponse.json({ error: "Registration is currently closed." }, { status: 403 });
    }

    const requireApproval = await getSetting("requireRegistrationApproval");

    const body = await req.json();

    // Validate request body using Zod schema
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid registration inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    if (data.type === "LEARNER") {
      return await registerLearner(data, requireApproval);
    } else {
      return await registerTutor(data, requireApproval);
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Learner Registration Helper ──────────────────────────────────────────────

const PENDING_MESSAGE =
  "Registration received. An administrator needs to approve your account before you can sign in.";

async function registerLearner(data: LearnerRegisterInput, requireApproval = false) {
  const {
    firstName,
    lastName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    consentGiven,
  } = data;

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
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: Role.STUDENT_LEARNER,
      gradeLevel,
      section,
      contactInfo: contactInfo || null,
      consentGiven,
      ...(requireApproval ? { status: "PENDING" as const } : {}),
    },
    select: {
      anonymousId: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json(
    {
      message: requireApproval ? PENDING_MESSAGE : "Registration successful.",
      anonymousId: user.anonymousId,
      pendingApproval: requireApproval,
    },
    { status: 201 }
  );
}

// ─── Tutor Registration Helper ────────────────────────────────────────────────

async function registerTutor(data: TutorRegisterInput, requireApproval = false) {
  const {
    firstName,
    lastName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    consentGiven,
  } = data;

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
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: Role.STUDENT_TUTOR,
        gradeLevel,
        section,
        contactInfo: contactInfo || null,
        consentGiven,
        ...(requireApproval ? { status: "PENDING" as const } : {}),
        tutorProfile: {
          create: {},
        },
      },
      select: {
        anonymousId: true,
        email: true,
        role: true,
      },
    });

    return newUser;
  });

  return NextResponse.json(
    {
      message: requireApproval
        ? PENDING_MESSAGE
        : "Registration successful. Start by creating your first class — you can request a topic assessment once you're teaching it.",
      anonymousId: user.anonymousId,
      pendingApproval: requireApproval,
    },
    { status: 201 }
  );
}
