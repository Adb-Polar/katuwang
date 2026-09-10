import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma, ReportViolationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations/report";
import { notifyMany } from "@/lib/notifications";

interface ReportRow {
  id: string;
  targetType: "TUTOR" | "CLASS";
  details: string | null;
  status: string;
  resolutionNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  violations: { type: string }[];
  class: { code: string; subject: string } | null;
  reportedTutorProfile: { user: { anonymousId: string } } | null;
}

// The reporter never learns who reviewed their report — `reviewedBy` is omitted.
function serialize(r: ReportRow) {
  return {
    id: r.id,
    targetType: r.targetType,
    target:
      r.targetType === "TUTOR"
        ? { anonymousId: r.reportedTutorProfile?.user.anonymousId ?? null }
        : { code: r.class?.code ?? null, subject: r.class?.subject ?? null },
    violations: r.violations.map((v) => v.type),
    details: r.details,
    status: r.status,
    resolutionNote: r.resolutionNote,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
  };
}

// ─── GET: The caller's own reports ──────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id },
      include: {
        violations: { select: { type: true } },
        class: { select: { code: true, subject: true } },
        reportedTutorProfile: { select: { user: { select: { anonymousId: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports: reports.map(serialize) });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: A learner reports a tutor or a class ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = createReportSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { targetType, targetId, violations } = result.data;
    const details = result.data.details?.trim() || null;
    const reporterId = session.user.id;
    const violationRows = [...new Set<ReportViolationType>(violations)].map((type) => ({ type }));

    // Resolve the target, confirm the learner has standing to report it, and
    // block a second open report against the same target.
    let createData: Prisma.ReportUncheckedCreateInput;
    let notifyMessage: string;

    if (targetType === "TUTOR") {
      const tutor = await prisma.user.findFirst({
        where: { id: targetId, role: "STUDENT_TUTOR" },
        select: {
          tutorProfile: { select: { id: true, user: { select: { anonymousId: true } } } },
        },
      });
      if (!tutor || !tutor.tutorProfile) {
        return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
      }

      const relationship = await prisma.classEnrollment.findFirst({
        where: { learnerId: reporterId, class: { tutorProfileId: tutor.tutorProfile.id } },
        select: { id: true },
      });
      if (!relationship) {
        return NextResponse.json(
          { error: "You can only report a tutor whose class you have joined." },
          { status: 403 }
        );
      }

      const openReport = await prisma.report.findFirst({
        where: { reporterId, status: "PENDING", reportedTutorProfileId: tutor.tutorProfile.id },
        select: { id: true },
      });
      if (openReport) {
        return NextResponse.json(
          { error: "You already have a report about this tutor awaiting review." },
          { status: 409 }
        );
      }

      createData = {
        reporterId,
        targetType: "TUTOR",
        details,
        reportedTutorProfileId: tutor.tutorProfile.id,
        violations: { create: violationRows },
      };
      notifyMessage = `A learner reported tutor ${tutor.tutorProfile.user.anonymousId}.`;
    } else {
      const targetClass = await prisma.tutorClass.findUnique({
        where: { id: targetId },
        select: { id: true, code: true, subject: true },
      });
      if (!targetClass) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      const relationship = await prisma.classEnrollment.findUnique({
        where: { classId_learnerId: { classId: targetId, learnerId: reporterId } },
        select: { id: true },
      });
      if (!relationship) {
        return NextResponse.json(
          { error: "You can only report a class you are enrolled in." },
          { status: 403 }
        );
      }

      const openReport = await prisma.report.findFirst({
        where: { reporterId, status: "PENDING", classId: targetId },
        select: { id: true },
      });
      if (openReport) {
        return NextResponse.json(
          { error: "You already have a report about this class awaiting review." },
          { status: 409 }
        );
      }

      createData = {
        reporterId,
        targetType: "CLASS",
        details,
        classId: targetId,
        violations: { create: violationRows },
      };
      notifyMessage = `A learner reported the class ${targetClass.subject} · ${targetClass.code}.`;
    }

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({ data: createData });

      // Let every active admin know there's a report waiting for review.
      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        "REPORT_NEW",
        notifyMessage,
        "/admin/abuse-reports"
      );

      return created;
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error filing report:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
