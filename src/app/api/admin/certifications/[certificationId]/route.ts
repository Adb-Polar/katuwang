import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewCertificationSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── PATCH: Approve or Reject a Pending Topic Certification ───────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { certificationId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const certification = await prisma.topicCertification.findUnique({
      where: { id: certificationId },
      select: { id: true, status: true },
    });

    if (!certification) {
      return NextResponse.json({ error: "Certification request not found." }, { status: 404 });
    }

    if (certification.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only a pending certification request can be reviewed." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = reviewCertificationSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status } = result.data;

    if (status === "REJECTED") {
      const deleted = await prisma.$transaction(async (tx) => {
        const removed = await tx.topicCertification.delete({
          where: { id: certificationId },
        });

        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: AUDIT_ACTIONS.CERTIFICATION_REJECTED,
            targetType: AUDIT_TARGET_TYPES.CERTIFICATION,
            targetId: certificationId,
          },
        });

        return removed;
      });

      return NextResponse.json(deleted);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const certified = await tx.topicCertification.update({
        where: { id: certificationId },
        data: { status: "CERTIFIED", certifiedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.CERTIFICATION_APPROVED,
          targetType: AUDIT_TARGET_TYPES.CERTIFICATION,
          targetId: certificationId,
        },
      });

      return certified;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing topic certification:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
