import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewRegistrationSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── PATCH: Approve or Decline a Pending Registration ─────────────────────────
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
      select: { id: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.status !== "PENDING") {
      return NextResponse.json(
        { error: "This account is not awaiting approval." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = reviewRegistrationSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { decision, reason } = result.data;
    const approved = decision === "APPROVE";

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: approved
          ? { status: "ACTIVE", statusReason: null, statusUpdatedAt: new Date() }
          : { status: "BANNED", statusReason: reason || null, statusUpdatedAt: new Date() },
        select: { id: true, anonymousId: true, status: true, statusReason: true },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: approved ? AUDIT_ACTIONS.USER_APPROVED : AUDIT_ACTIONS.USER_DECLINED,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: userId,
          reason: reason || null,
        },
      });

      return u;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing registration:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
