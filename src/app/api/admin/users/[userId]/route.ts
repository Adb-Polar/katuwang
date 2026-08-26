import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserStatusSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { computeExpiresAt } from "@/lib/moderation";

// ─── PATCH: Suspend, Ban, or Reactivate a Learner/Tutor Account ───────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot modify an admin account." }, { status: 400 });
    }

    const body = await req.json();
    const result = updateUserStatusSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status, reason, durationDays } = result.data;
    const statusExpiresAt = status === "SUSPENDED" ? computeExpiresAt(durationDays) : null;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status,
          statusReason: reason || null,
          statusUpdatedAt: new Date(),
          statusExpiresAt,
        },
        select: {
          id: true,
          anonymousId: true,
          status: true,
          statusReason: true,
          statusUpdatedAt: true,
          statusExpiresAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: userId,
          reason: reason || null,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
