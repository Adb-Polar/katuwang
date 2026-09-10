import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, ReportStatus, ReportTargetType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSort } from "@/lib/sortParams";

const DEFAULT_PAGE_SIZE = 10;

const REPORT_SORT_COLUMN: Record<string, "createdAt" | "reviewedAt" | "targetType" | "status"> = {
  createdAt: "createdAt",
  reviewedAt: "reviewedAt",
  targetType: "targetType",
  status: "status",
};

// ─── GET: List abuse reports (tabbed / paginated) ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status: ReportStatus =
      statusParam && statusParam in ReportStatus
        ? (statusParam as ReportStatus)
        : "PENDING";
    const targetTypeParam = searchParams.get("targetType");
    const targetType: ReportTargetType | null =
      targetTypeParam && targetTypeParam in ReportTargetType
        ? (targetTypeParam as ReportTargetType)
        : null;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );
    const { sort, dir } = parseSort(
      searchParams,
      Object.keys(REPORT_SORT_COLUMN),
      status === "PENDING" ? "createdAt" : "reviewedAt",
      status === "PENDING" ? "asc" : "desc"
    );

    const where: Prisma.ReportWhereInput = {
      status,
      ...(targetType ? { targetType } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          violations: { select: { type: true } },
          reporter: { select: { anonymousId: true } },
          class: { select: { id: true, code: true, subject: true, status: true } },
          reportedTutorProfile: {
            select: { user: { select: { id: true, anonymousId: true } } },
          },
        },
        orderBy: { [REPORT_SORT_COLUMN[sort]]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    const reports = rows.map(({ violations, reportedTutorProfile, ...r }) => ({
      ...r,
      violations: violations.map((v) => v.type),
      tutor: reportedTutorProfile?.user ?? null,
    }));

    return NextResponse.json({ reports, total, page, pageSize });
  } catch (error) {
    console.error("Error listing abuse reports:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
