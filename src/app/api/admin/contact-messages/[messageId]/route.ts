import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { reviewContactMessageSchema } from "@/lib/validations/contact";

// ─── PATCH: Resolve or re-open a contact message ───────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { messageId } = await params;
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = reviewContactMessageSchema.safeParse(await req.json());
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const { status, adminNote } = result.data;

    const existing = await prisma.contactMessage.findUnique({ where: { id: messageId }, select: { status: true } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    if (existing.status === status) {
      return NextResponse.json({ error: `This message is already ${status.toLowerCase()}.` }, { status: 409 });
    }

    const resolving = status === "RESOLVED";
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.contactMessage.update({
        where: { id: messageId },
        data: {
          status,
          adminNote: adminNote || null,
          resolvedById: resolving ? session.user.id : null,
          resolvedAt: resolving ? new Date() : null,
        },
        select: { id: true, status: true, adminNote: true, resolvedAt: true },
      });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: resolving ? AUDIT_ACTIONS.CONTACT_MESSAGE_RESOLVED : AUDIT_ACTIONS.CONTACT_MESSAGE_REOPENED,
          targetType: AUDIT_TARGET_TYPES.CONTACT_MESSAGE,
          targetId: messageId,
          reason: adminNote || null,
        },
      });
      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing contact message:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
