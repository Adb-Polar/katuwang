import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClassStatusSchema } from "@/lib/validations/admin";

// ─── PATCH: Suspend or Reinstate a Class ───────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { classId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existingClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      select: { id: true, status: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = updateClassStatusSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status, reason } = result.data;

    if (status === "SUSPENDED" && existingClass.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only a scheduled class can be suspended." },
        { status: 400 }
      );
    }

    if (status === "SCHEDULED" && existingClass.status !== "SUSPENDED") {
      return NextResponse.json(
        { error: "Only a suspended class can be reinstated." },
        { status: 400 }
      );
    }

    const updatedClass = await prisma.tutorClass.update({
      where: { id: classId },
      data: {
        status,
        suspendedReason: status === "SUSPENDED" ? reason || null : null,
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating class status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
