import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getServerSession } from "next-auth";
import { Prisma, ClassAppealStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSort } from "@/lib/sortParams";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

const APPEAL_SORT_COLUMN: Record<string, "createdAt" | "reviewedAt" | "status"> = {
  createdAt: "createdAt",
  reviewedAt: "reviewedAt",
  status: "status",
};

// ─── GET: List class appeals (tabbed / paginated) ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status: ClassAppealStatus =
      statusParam && statusParam in ClassAppealStatus
        ? (statusParam as ClassAppealStatus)
        : "PENDING";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );
    const { sort, dir } = parseSort(
      searchParams,
      Object.keys(APPEAL_SORT_COLUMN),
      status === "PENDING" ? "createdAt" : "reviewedAt",
      status === "PENDING" ? "asc" : "desc"
    );

    const where: Prisma.ClassAppealWhereInput = { status };

    const [rows, total] = await Promise.all([
      prisma.classAppeal.findMany({
        where,
        include: {
          class: {
            select: { id: true, code: true, subject: true, status: true, suspendedReason: true },
          },
          tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
        },
        orderBy: { [APPEAL_SORT_COLUMN[sort]]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.classAppeal.count({ where }),
    ]);

    const appeals = rows.map(({ tutorProfile, ...a }) => ({ ...a, tutor: tutorProfile.user }));

    return NextResponse.json({ appeals, total, page, pageSize });
  } catch (error) {
    console.error("Error listing class appeals:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
