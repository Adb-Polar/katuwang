import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validations/class";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { getSetting } from "@/lib/settings";

// ─── GET: Fetch Tutor's Classes ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const classes = await prisma.tutorClass.findMany({
      where: {
        tutorProfileId: tutorProfile.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        topics: true,
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

    return NextResponse.json(
      classes.map((c) => ({ ...c, topics: c.topics.map((t) => t.topic) }))
    );
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

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      subject,
      topics,
      description,
      scheduledAt,
      duration,
      maxStudents,
      meetingLink,
    } = result.data;

    // Ensure every selected topic belongs to the chosen subject's predefined list
    const validTopics = SUBJECT_TOPICS[subject];
    if (topics.some((t) => !validTopics.includes(t))) {
      return NextResponse.json(
        { error: `One or more selected topics are not valid for ${subject}.` },
        { status: 400 }
      );
    }

    // If enabled, only allow topics the tutor holds a CERTIFIED certification for
    const requireCertification = await getSetting("requireCertificationForClassCreation");
    if (requireCertification) {
      const certifiedTopics = await prisma.topicCertification.findMany({
        where: { tutorProfileId: tutorProfile.id, subject, status: "CERTIFIED" },
        select: { topic: true },
      });
      const certifiedTopicSet = new Set(certifiedTopics.map((c) => c.topic));
      const uncertifiedTopics = topics.filter((t) => !certifiedTopicSet.has(t));

      if (uncertifiedTopics.length > 0) {
        return NextResponse.json(
          { error: `You are not certified for: ${uncertifiedTopics.join(", ")}.` },
          { status: 400 }
        );
      }
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

    // 1. Overlap Conflict Detection Logic
    const scheduledClasses = await prisma.tutorClass.findMany({
      where: {
        tutorProfileId: tutorProfile.id,
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

    // 2. Create the class
    const newClass = await prisma.tutorClass.create({
      data: {
        tutorProfileId: tutorProfile.id,
        subject,
        topics: { create: topics.map((topic) => ({ topic })) },
        description: description || null,
        scheduledAt: start,
        duration,
        maxStudents,
        meetingLink: meetingLink || null,
        status: "SCHEDULED",
      },
      include: { topics: true },
    });

    return NextResponse.json(
      { ...newClass, topics: newClass.topics.map((t) => t.topic) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
