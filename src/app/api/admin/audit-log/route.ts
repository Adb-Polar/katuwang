import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 25;
const SORTABLE = new Set(["createdAt", "action", "targetType"]);

// ─── GET: Admin Moderation Action History (filtered / sorted / paginated) ─────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action")?.trim() || "";
    const targetType = searchParams.get("targetType")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = SORTABLE.has(sortParam) ? sortParam : "createdAt";
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
      ...(q
        ? {
            OR: [
              { reason: { contains: q } },
              { targetId: { contains: q } },
              { admin: { anonymousId: { contains: q } } },
            ],
          }
        : {}),
    };

    const [logs, total, actionGroups, targetGroups] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { anonymousId: true, firstName: true, lastName: true } } },
        orderBy: { [sort]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true } }),
      prisma.auditLog.groupBy({ by: ["targetType"], _count: { _all: true } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      facets: {
        actions: actionGroups.map((g) => g.action).sort(),
        targetTypes: targetGroups.map((g) => g.targetType).sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
