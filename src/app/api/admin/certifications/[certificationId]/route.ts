import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { reviewCertificationSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { findPassingQualification } from "@/lib/certificationApproval";
import { lockTutorProfile, ClassWriteError } from "@/lib/classLocks";
import { notify } from "@/lib/notifications";

// ─── PATCH: Approve or Reject a Pending Topic Certification ───────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { certificationId } = await params;

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const certification = await prisma.topicCertification.findUnique({
      where: { id: certificationId },
      select: {
        id: true,
        tutorProfileId: true,
        status: true,
        subject: true,
        topic: true,
        tutorProfile: { select: { userId: true } },
      },
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
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { status, reviewNote, method, evidence } = result.data;
    const updated = await prisma.$transaction(async (tx) => {
      await lockTutorProfile(tx, certification.tutorProfileId);
      const current = await tx.topicCertification.findUnique({ where: { id: certificationId }, include: { tutorProfile: { select: { userId: true } } } });
      if (!current) throw new ClassWriteError("Certification request not found.", 404);
      if (current.status !== "PENDING") throw new ClassWriteError("This certification has already been reviewed or earned. Reload before continuing.", 409);
      if (status === "CERTIFIED" && !await tx.topic.findFirst({ where: { name: current.topic, active: true, subject: { slug: current.subject, active: true } }, select: { id: true } })) {
        throw new ClassWriteError("This subject or topic was retired. Use a current catalog topic for certification.", 400);
      }
      let qualifyingAttemptId: string | null = null;
      if (status === "CERTIFIED" && method === "ASSESSMENT") {
        const passing = await findPassingQualification(tx, current);
        if (!passing) throw new ClassWriteError("A submitted passing assessment for this tutor and topic is required. Use manual certification only with documented qualification evidence.", 409);
        qualifyingAttemptId = passing.id;
      }
      const now = new Date();
      const manual = status === "CERTIFIED" && method === "MANUAL";
      const row = await tx.topicCertification.update({
        where: { id: certificationId },
        data: {
          status, reviewedAt: now, certifiedAt: status === "CERTIFIED" ? now : null,
          reviewNote: manual || status === "REJECTED" ? reviewNote || null : null,
          approvalMethod: status === "CERTIFIED" ? method : null,
          approvalEvidence: manual ? evidence! : null, qualifyingAttemptId,
        },
      });
      await tx.auditLog.create({ data: {
        adminId: session.user.id,
        action: status === "REJECTED" ? AUDIT_ACTIONS.CERTIFICATION_REJECTED : manual ? AUDIT_ACTIONS.CERTIFICATION_MANUAL_APPROVED : AUDIT_ACTIONS.CERTIFICATION_APPROVED,
        targetType: AUDIT_TARGET_TYPES.CERTIFICATION, targetId: certificationId,
        reason: status === "REJECTED" ? reviewNote || null : JSON.stringify({ method, reason: manual ? reviewNote : null, evidence: manual ? evidence : null, qualifyingAttemptId }),
      } });
      await notify(tx, current.tutorProfile.userId,
        status === "CERTIFIED" ? "CERTIFICATION_CERTIFIED" : "CERTIFICATION_REJECTED",
        status === "CERTIFIED"
          ? `You're now certified to teach ${current.subject} · ${current.topic}. You can create classes for it.`
          : `Your certification for ${current.subject} · ${current.topic} wasn't approved.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
        "/tutor/assessments");
      return row;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ClassWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error reviewing topic certification:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
