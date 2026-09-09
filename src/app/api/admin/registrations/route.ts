import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role, GradeLevel } from "@prisma/client";
import { parseSort } from "@/lib/sortParams";

const DEFAULT_PAGE_SIZE = 10;

const REG_SORT_COLUMN: Record<string, "createdAt" | "lastName" | "role" | "anonymousId"> = {
  createdAt: "createdAt",
  name: "lastName",
  role: "role",
  code: "anonymousId",
};

// ─── GET: List Accounts Awaiting Approval ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role");
    const gradeLevel = searchParams.get("gradeLevel");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );
    const { sort, dir } = parseSort(searchParams, Object.keys(REG_SORT_COLUMN), "createdAt", "asc");

    const where: Prisma.UserWhereInput = {
      status: "PENDING",
      ...(role && role in Role ? { role: role as Role } : { role: { not: "ADMIN" } }),
      ...(gradeLevel && gradeLevel in GradeLevel ? { gradeLevel: gradeLevel as GradeLevel } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { anonymousId: { contains: q } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          anonymousId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          gradeLevel: true,
          section: true,
          createdAt: true,
        },
        orderBy: { [REG_SORT_COLUMN[sort]]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    console.error("Error fetching registration queue:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
