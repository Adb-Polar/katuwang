import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClassStatusSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { computeExpiresAt } from "@/lib/moderation";

// ─── PATCH: Suspend, Ban, or Reinstate a Class ─────────────────────────────────
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

    const { status, reason, durationDays } = result.data;

    if (status === "SUSPENDED" && existingClass.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only a scheduled class can be suspended." },
        { status: 400 }
      );
    }

    if (status === "BANNED" && !["SCHEDULED", "SUSPENDED"].includes(existingClass.status)) {
      return NextResponse.json(
        { error: "Only a scheduled or suspended class can be banned." },
        { status: 400 }
      );
    }

    if (status === "SCHEDULED" && !["SUSPENDED", "BANNED"].includes(existingClass.status)) {
      return NextResponse.json(
        { error: "Only a suspended or banned class can be reinstated." },
        { status: 400 }
      );
    }

    const isModerated = status === "SUSPENDED" || status === "BANNED";

    const updatedClass = await prisma.$transaction(async (tx) => {
      const updated = await tx.tutorClass.update({
        where: { id: classId },
        data: {
          status,
          suspendedReason: isModerated ? reason || null : null,
          suspendedUntil: status === "SUSPENDED" ? computeExpiresAt(durationDays) : null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.CLASS_STATUS_CHANGE,
          targetType: AUDIT_TARGET_TYPES.CLASS,
          targetId: classId,
          reason: isModerated ? reason || null : null,
        },
      });

      return updated;
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
