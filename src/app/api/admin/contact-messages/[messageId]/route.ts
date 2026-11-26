import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { requireAdminSession } from "@/lib/permissions";
import { contactCategoryLabel, updateContactMessageSchema } from "@/lib/validations/contact";

// ─── PATCH: Mark a contact message handled, or reopen it ────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const { messageId } = await params;
    const result = updateContactMessageSchema.safeParse(await req.json().catch(() => null));
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || "Invalid inputs." }, { status: 400 });
    }
    const { status } = result.data;
    const adminId = auth.session.user.id;

    const existing = await prisma.contactMessage.findUnique({
      where: { id: messageId },
      select: { id: true, status: true, category: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    if (existing.status === status) {
      return NextResponse.json(
        { error: status === "HANDLED" ? "This message is already marked as handled." : "This message is already open." },
        { status: 409 }
      );
    }

    const handled = status === "HANDLED";
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.contactMessage.update({
        where: { id: messageId },
        data: handled ? { status, handledById: adminId, handledAt: new Date() } : { status, handledById: null, handledAt: null },
        select: { id: true, status: true, handledAt: true },
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: handled ? AUDIT_ACTIONS.CONTACT_MESSAGE_HANDLED : AUDIT_ACTIONS.CONTACT_MESSAGE_REOPENED,
          targetType: AUDIT_TARGET_TYPES.CONTACT_MESSAGE,
          targetId: messageId,
          // The category only: the sender's name, email and message stay out of the log.
          reason: contactCategoryLabel(existing.category),
        },
      });
      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contact message:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
