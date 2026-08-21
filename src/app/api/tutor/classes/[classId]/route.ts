import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validations/class";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (existingClass.tutorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();

    // Custom status validation check if provided
    if (body.status && !["SCHEDULED", "COMPLETED", "CANCELLED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid class status." }, { status: 400 });
    }

    // Validate using Zod (partial update)
    const result = createClassSchema.partial().safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updates = result.data;

    // 1. Capacity validation if updating maxStudents
    if (updates.maxStudents !== undefined) {
      if (updates.maxStudents < existingClass._count.enrollments) {
        return NextResponse.json(
          { error: `Cannot reduce capacity below the current enrollment count of ${existingClass._count.enrollments}.` },
          { status: 400 }
        );
      }
    }

    // 2. Schedule conflict validation if updating scheduledAt or duration
    if (updates.scheduledAt || updates.duration !== undefined) {
      const newStart = updates.scheduledAt ? new Date(updates.scheduledAt) : new Date(existingClass.scheduledAt);
      const newDuration = updates.duration !== undefined ? updates.duration : existingClass.duration;
      const newEnd = new Date(newStart.getTime() + newDuration * 60 * 1000);

      // Check conflict if class is still active (SCHEDULED)
      const targetStatus = body.status || existingClass.status;
      if (targetStatus === "SCHEDULED") {
        if (newStart.getTime() < Date.now()) {
          return NextResponse.json(
            { error: "Cannot schedule a class in the past." },
            { status: 400 }
          );
        }

        const otherClasses = await prisma.tutorClass.findMany({
          where: {
            tutorId: session.user.id,
            status: "SCHEDULED",
            id: { not: classId },
          },
        });

        const hasConflict = otherClasses.some((other) => {
          const otherStart = new Date(other.scheduledAt).getTime();
          const otherEnd = otherStart + other.duration * 60 * 1000;
          return newStart.getTime() < otherEnd && newEnd.getTime() > otherStart;
        });

        if (hasConflict) {
          return NextResponse.json(
            { error: "Time conflict detected: You already have another class scheduled during this time." },
            { status: 409 }
          );
        }
      }
    }

    // 3. Apply updates to the database
    const updatedClass = await prisma.tutorClass.update({
      where: { id: classId },
      data: {
        ...updates,
        ...(body.status ? { status: body.status } : {}),
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (existingClass.tutorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Restrict deletion if students are enrolled
    if (existingClass._count.enrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete a class that has enrolled learners. Please cancel the class instead." },
        { status: 400 }
      );
    }

    await prisma.tutorClass.delete({
      where: { id: classId },
    });

    return NextResponse.json({ message: "Class deleted successfully." });
  } catch (error) {
    console.error("Error deleting tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
