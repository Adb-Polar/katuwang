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
    subjects = [],        // string[] — multi-select from SubjectArea enum
    availability = [],    // [{ day: string, startTime: string, endTime: string }]
    consentGiven,
  } = body;

  // Validate required fields
  if (
    !fullName ||
    !email ||
    !password ||
    !gradeLevel ||
    !section
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
            availability: availability ?? [],
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
