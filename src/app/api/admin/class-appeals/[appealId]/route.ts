import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewClassAppealSchema } from "@/lib/validations/classAppeal";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { notify } from "@/lib/notifications";

// ─── PATCH: An admin approves or rejects a pending class appeal ─────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { appealId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const appeal = await prisma.classAppeal.findUnique({
      where: { id: appealId },
      select: {
        id: true,
        status: true,
        classId: true,
        tutorProfile: { select: { userId: true } },
        class: { select: { code: true, subject: true } },
      },
    });

    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found." }, { status: 404 });
    }

    if (appeal.status !== "PENDING") {
      return NextResponse.json(
        { error: "This appeal has already been reviewed." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = reviewClassAppealSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { decision, reviewNote } = result.data;
    const approved = decision === "APPROVE";
    const now = new Date();
    const label = `${appeal.class.subject} · ${appeal.class.code}`;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.classAppeal.update({
        where: { id: appealId },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          reviewNote: reviewNote || null,
          reviewedById: session.user.id,
          reviewedAt: now,
        },
      });

      if (approved) {
        // Reinstate the class — mirrors the admin "reinstate" path.
        await tx.tutorClass.update({
          where: { id: appeal.classId },
          data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: approved ? AUDIT_ACTIONS.CLASS_APPEAL_APPROVED : AUDIT_ACTIONS.CLASS_APPEAL_REJECTED,
          targetType: AUDIT_TARGET_TYPES.CLASS_APPEAL,
          targetId: appealId,
          reason: reviewNote || label,
        },
      });

      await notify(
        tx,
        appeal.tutorProfile.userId,
        approved ? "CLASS_APPEAL_APPROVED" : "CLASS_APPEAL_REJECTED",
        approved
          ? `Your appeal for ${label} was approved — the class is scheduled again.`
          : `Your appeal for ${label} was not approved.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
        `/tutor/classes/${appeal.classId}`
      );

      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing class appeal:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
