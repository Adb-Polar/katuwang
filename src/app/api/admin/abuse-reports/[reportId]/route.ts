import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewReportSchema } from "@/lib/validations/report";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { notify } from "@/lib/notifications";

// ─── PATCH: An admin resolves or dismisses a pending report ────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reportId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        reporterId: true,
        targetType: true,
        class: { select: { code: true, subject: true } },
        reportedTutorProfile: { select: { user: { select: { anonymousId: true } } } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (report.status !== "PENDING") {
      return NextResponse.json(
        { error: "This report has already been reviewed." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = reviewReportSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { decision, resolutionNote } = result.data;
    const resolved = decision === "RESOLVE";
    const now = new Date();
    const targetLabel =
      report.targetType === "TUTOR"
        ? `tutor ${report.reportedTutorProfile?.user.anonymousId ?? "—"}`
        : `${report.class?.subject ?? "—"} · ${report.class?.code ?? "—"}`;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.report.update({
        where: { id: reportId },
        data: {
          status: resolved ? "RESOLVED" : "DISMISSED",
          resolutionNote: resolutionNote || null,
          reviewedById: session.user.id,
          reviewedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: resolved ? AUDIT_ACTIONS.REPORT_RESOLVED : AUDIT_ACTIONS.REPORT_DISMISSED,
          targetType: AUDIT_TARGET_TYPES.REPORT,
          targetId: reportId,
          reason: resolutionNote || targetLabel,
        },
      });

      await notify(
        tx,
        report.reporterId,
        "REPORT_REVIEWED",
        resolved
          ? `An admin reviewed your report about ${targetLabel} and took action.${resolutionNote ? ` Note: ${resolutionNote}` : ""}`
          : `An admin reviewed your report about ${targetLabel} and closed it without action.${resolutionNote ? ` Note: ${resolutionNote}` : ""}`,
        "/learner/reports"
      );

      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing report:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
