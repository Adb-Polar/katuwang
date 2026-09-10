import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addSessionSchema } from "@/lib/validations/class";
import { hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";

// ─── POST: Add a New Session to an Existing Class ──────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

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

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      include: { topics: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (existingClass.tutorProfileId !== tutorProfile.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (existingClass.status === "SUSPENDED" || existingClass.status === "BANNED") {
      return NextResponse.json(
        { error: "This class was suspended or banned by an administrator and can't be modified." },
        { status: 403 }
      );
    }

    if (existingClass.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Cannot add a session to a class that isn't scheduled." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = addSessionSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { topic, scheduledAt, duration } = result.data;

    const classTopics = existingClass.topics.map((t) => t.topic);
    if (!classTopics.includes(topic)) {
      return NextResponse.json(
        { error: "Session topic must be one of the class's selected topics." },
        { status: 400 }
      );
    }

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + duration * MINUTE_MS);

    if (start.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Cannot schedule a session in the past." },
        { status: 400 }
      );
    }

    const conflict = await hasSessionOverlap(tutorProfile.id, start, end);
    if (conflict) {
      return NextResponse.json(
        { error: "Time conflict detected: You already have a session scheduled during this time." },
        { status: 409 }
      );
    }

    const newSession = await prisma.classSession.create({
      data: { classId, topic, scheduledAt: start, duration },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error adding class session:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
