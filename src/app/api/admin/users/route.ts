import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role, AccountStatus } from "@prisma/client";
import { parseSort } from "@/lib/sortParams";

const DEFAULT_PAGE_SIZE = 10;

// sort key -> the scalar column it orders by
const USER_SORT_COLUMN: Record<
  string,
  "createdAt" | "lastName" | "status" | "role" | "anonymousId"
> = {
  createdAt: "createdAt",
  name: "lastName",
  status: "status",
  role: "role",
  code: "anonymousId",
};

// ─── GET: List Learner + Tutor Accounts for Moderation ────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
    const { sort, dir } = parseSort(searchParams, Object.keys(USER_SORT_COLUMN), "createdAt");

    const where: Prisma.UserWhereInput = {
      role: role && role in Role ? (role as Role) : { not: "ADMIN" },
      // Declined applicants are terminal — hide them unless explicitly filtered for.
      ...(status && status in AccountStatus
        ? { status: status as AccountStatus }
        : { status: { not: "DECLINED" } }),
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
          status: true,
          statusReason: true,
          statusUpdatedAt: true,
          statusExpiresAt: true,
          createdAt: true,
        },
        orderBy: { [USER_SORT_COLUMN[sort]]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    console.error("Error fetching admin user list:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
