import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validations/class";

// ─── GET: Fetch Tutor's Classes ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const classes = await prisma.tutorClass.findMany({
      where: {
        tutorId: session.user.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        enrollments: {
          include: {
            learner: {
              select: {
                id: true,
                anonymousId: true,
                firstName: true,
                lastName: true,
                gradeLevel: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching tutor classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── POST: Create a New Class ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      subject,
      topic,
      description,
      scheduledAt,
      duration,
      maxStudents,
      meetingLink,
    } = result.data;

    // 1. Verify tutor certification for the chosen subject
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        appliedSubjects: {
          where: { subject, certified: true },
        },
      },
    });

    if (!profile || profile.appliedSubjects.length === 0) {
      return NextResponse.json(
        { error: `You are not certified to tutor in ${subject}.` },
        { status: 403 }
      );
    }

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Prevent scheduling classes in the past
    if (start.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Cannot schedule a class in the past." },
        { status: 400 }
      );
    }

    // 2. Overlap Conflict Detection Logic
    const scheduledClasses = await prisma.tutorClass.findMany({
      where: {
        tutorId: session.user.id,
        status: "SCHEDULED",
      },
    });

    const hasConflict = scheduledClasses.some((existing) => {
      const existingStart = new Date(existing.scheduledAt).getTime();
      const existingEnd = existingStart + existing.duration * 60 * 1000;
      return start.getTime() < existingEnd && end.getTime() > existingStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "Time conflict detected: You already have a class scheduled during this time." },
        { status: 409 }
      );
    }

    // 3. Create the class
    const newClass = await prisma.tutorClass.create({
      data: {
        tutorId: session.user.id,
        subject,
        topic,
        description: description || null,
        scheduledAt: start,
        duration,
        maxStudents,
        meetingLink: meetingLink || null,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
