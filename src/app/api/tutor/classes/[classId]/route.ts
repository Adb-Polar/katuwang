import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classDetailsSchema } from "@/lib/validations/class";


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
        topics: { select: { topic: true } },
        sessions: { select: { topic: true } },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile || existingClass.tutorProfileId !== tutorProfile.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (existingClass.status === "SUSPENDED" || existingClass.status === "BANNED") {
      return NextResponse.json(
        { error: "This class was suspended or banned by an administrator and can't be modified." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Custom status validation check if provided
    if (body.status && !["SCHEDULED", "COMPLETED", "CANCELLED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid class status." }, { status: 400 });
    }

    // Validate using Zod (partial update — class-level fields only, not sessions)
    const result = classDetailsSchema.partial().safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { topics, ...updates } = result.data;

    // Capacity validation if updating maxStudents
    if (updates.maxStudents !== undefined) {
      if (updates.maxStudents < existingClass._count.enrollments) {
        return NextResponse.json(
          { error: `Cannot reduce capacity below the current enrollment count of ${existingClass._count.enrollments}.` },
          { status: 400 }
        );
      }
    }

    // Block removing a topic that's currently used by one of the class's sessions
    if (topics) {
      const currentTopics = existingClass.topics.map((t) => t.topic);
      const removedTopics = currentTopics.filter((t) => !topics.includes(t));
      const usedTopics = new Set(existingClass.sessions.map((s) => s.topic));
      const blockedRemovals = removedTopics.filter((t) => usedTopics.has(t));

      if (blockedRemovals.length > 0) {
        return NextResponse.json(
          { error: `Cannot remove topic(s) currently used by a session: ${blockedRemovals.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    // Cancelling/completing the whole class cascades to every still-SCHEDULED session
    const newStatus = body.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | undefined;

    const updatedClass = await prisma.$transaction(async (tx) => {
      if (newStatus === "CANCELLED" || newStatus === "COMPLETED") {
        await tx.classSession.updateMany({
          where: { classId, status: "SCHEDULED" },
          data: { status: newStatus },
        });
      }

      return tx.tutorClass.update({
        where: { id: classId },
        data: {
          ...updates,
          ...(newStatus ? { status: newStatus } : {}),
          ...(topics
            ? { topics: { deleteMany: {}, create: topics.map((topic) => ({ topic })) } }
            : {}),
        },
        include: { topics: true, sessions: { orderBy: { scheduledAt: "asc" } } },
      });
    });

    return NextResponse.json({
      ...updatedClass,
      topics: updatedClass.topics.map((t) => t.topic),
    });
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

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile || existingClass.tutorProfileId !== tutorProfile.id) {
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
