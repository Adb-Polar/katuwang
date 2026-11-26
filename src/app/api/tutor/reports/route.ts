import { NextRequest, NextResponse } from "next/server";
import type { ReportViolationType } from "@prisma/client";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { createLearnerReportSchema } from "@/lib/validations/report";
import { notifyMany } from "@/lib/notifications";

// ─── GET: The tutor's own reports about learners ────────────────────────────
// The reported learner appears by anonymous ID only, and the reviewing admin is omitted.
export async function GET() {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id, targetType: "LEARNER" },
      select: {
        id: true,
        details: true,
        status: true,
        resolutionNote: true,
        reviewedAt: true,
        createdAt: true,
        violations: { select: { type: true } },
        reportedLearner: { select: { anonymousId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        targetType: "LEARNER" as const,
        target: { anonymousId: r.reportedLearner?.anonymousId ?? null },
        violations: r.violations.map((v) => v.type),
        details: r.details,
        status: r.status,
        resolutionNote: r.resolutionNote,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
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
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = createLearnerReportSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { targetId: learnerId, violations } = result.data;
    const details = result.data.details?.trim() || null;
    const reporterId = session.user.id;

    const learner = await prisma.user.findFirst({
      where: { id: learnerId, role: "STUDENT_LEARNER" },
      select: { id: true, anonymousId: true },
    });
    if (!learner) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    // Standing: the learner is, or was, enrolled in one of this tutor's classes.
    const relationship = await prisma.classEnrollment.findFirst({
      where: { learnerId, class: { tutorProfile: { userId: reporterId } } },
      select: { id: true },
    });
    if (!relationship) {
      return NextResponse.json(
        { error: "You can only report a learner who has joined one of your classes." },
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
          reportedLearnerId: learnerId,
          details,
          violations: { create: [...new Set<ReportViolationType>(violations)].map((type) => ({ type })) },
        },
        select: { id: true, status: true, createdAt: true },
      });

      const admins = await tx.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        "REPORT_NEW",
        `A tutor reported learner ${learner.anonymousId}.`,
        "/admin/abuse-reports"
      );

      return created;
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error filing tutor report:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
