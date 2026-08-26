import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";

// ─── POST: Enroll in a Class ──────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reinstateExpiredClasses();

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (existingClass.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "This class is no longer accepting enrollments." },
        { status: 400 }
      );
    }

    if (new Date(existingClass.scheduledAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Cannot enroll in a class that has already started." },
        { status: 400 }
      );
    }

    if (existingClass._count.enrollments >= existingClass.maxStudents) {
      return NextResponse.json(
        { error: "This class is already full." },
        { status: 409 }
      );
    }

    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: { classId_learnerId: { classId, learnerId: session.user.id } },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this class." },
        { status: 409 }
      );
    }

    const enrollment = await prisma.classEnrollment.create({
      data: { classId, learnerId: session.user.id },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error enrolling in class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Unenroll from a Class ────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: { classId_learnerId: { classId, learnerId: session.user.id } },
    });

    if (!existingEnrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this class." },
        { status: 404 }
      );
    }

    if (existingClass.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Cannot unenroll from a class that is already completed or cancelled." },
        { status: 400 }
      );
    }

    await prisma.classEnrollment.delete({
      where: { id: existingEnrollment.id },
    });

    return NextResponse.json({ message: "Unenrolled successfully." });
  } catch (error) {
    console.error("Error unenrolling from class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
