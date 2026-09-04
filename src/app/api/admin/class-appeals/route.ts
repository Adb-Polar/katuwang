import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, ClassAppealStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

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
        orderBy: status === "PENDING" ? { createdAt: "asc" } : { reviewedAt: "desc" },
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
