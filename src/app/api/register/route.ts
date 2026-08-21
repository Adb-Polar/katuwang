import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAnonymousId } from "@/lib/idGenerator";
import { Role } from "@prisma/client";
import { registerSchema, LearnerRegisterInput, TutorRegisterInput } from "@/lib/validations/auth";

// ─── Registration Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body using Zod schema
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid registration inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    if (data.type === "LEARNER") {
      return await registerLearner(data);
    } else {
      return await registerTutor(data);
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

async function registerLearner(data: LearnerRegisterInput) {
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

// ─── Tutor Registration Helper ────────────────────────────────────────────────

async function registerTutor(data: TutorRegisterInput) {
  const {
    firstName,
    lastName,
    email,
    password,
    gradeLevel,
    section,
    contactInfo,
    subjects,
    availability,
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
        tutorProfile: {
          create: {
            status: "PENDING",
            availability: availability,
            appliedSubjects: {
              create: subjects.map((subject) => ({
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
