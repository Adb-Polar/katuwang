import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ReportViolationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications";
import { createLearnerReportSchema } from "@/lib/validations/report";

// ─── GET: The tutor's own reports ───────────────────────────────────────────
// The reporter never learns who reviewed their report — `reviewedBy` is omitted.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id, targetType: "LEARNER" },
      include: {
        violations: { select: { type: true } },
        reportedLearner: { select: { anonymousId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reports: reports.map((report) => ({
        id: report.id,
        targetType: report.targetType,
        target: { anonymousId: report.reportedLearner?.anonymousId ?? null },
        violations: report.violations.map((v) => v.type),
        details: report.details,
        status: report.status,
        resolutionNote: report.resolutionNote,
        reviewedAt: report.reviewedAt,
        createdAt: report.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tutor reports:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

// ─── POST: A tutor reports a learner ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = createLearnerReportSchema.safeParse(await req.json());
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const { targetId: learnerId, violations } = result.data;
    const details = result.data.details?.trim() || null;
    const reporterId = session.user.id;

    const learner = await prisma.user.findFirst({
      where: { id: learnerId, role: "STUDENT_LEARNER" },
      select: { anonymousId: true },
    });
    if (!learner) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    // Standing: the learner must be (or have been) enrolled in one of this tutor's classes.
    const relationship = await prisma.classEnrollment.findFirst({
      where: { learnerId, class: { tutorProfile: { userId: reporterId } } },
      select: { id: true },
    });
    if (!relationship) {
      return NextResponse.json(
        { error: "You can only report a learner enrolled in one of your classes." },
        { status: 403 }
      );
    }

    const openReport = await prisma.report.findFirst({
      where: { reporterId, status: "PENDING", reportedLearnerId: learnerId },
      select: { id: true },
    });
    if (openReport) {
      return NextResponse.json(
        { error: "You already have a report about this learner awaiting review." },
        { status: 409 }
      );
    }

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reporterId,
          targetType: "LEARNER",
          details,
          reportedLearnerId: learnerId,
          violations: { create: [...new Set<ReportViolationType>(violations)].map((type) => ({ type })) },
        },
      });

      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((admin) => admin.id),
        "REPORT_NEW",
        `A tutor reported learner ${learner.anonymousId}.`,
        "/admin/abuse-reports"
      );

      return created;
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error filing learner report:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
