import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getServerSession } from "next-auth";
import { Prisma, QuestionRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

// ─── GET: List Question Requests (tabbed / filtered / paginated) ─────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status: QuestionRequestStatus =
      statusParam && statusParam in QuestionRequestStatus
        ? (statusParam as QuestionRequestStatus)
        : "OPEN";
    const subject = searchParams.get("subject");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.QuestionRequestWhereInput = {
      status,
      ...(subject ? { subject } : {}),
      ...(q
        ? {
            OR: [
              { topic: { contains: q } },
              { tutorProfile: { user: { anonymousId: { contains: q } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.questionRequest.findMany({
        where,
        include: {
          tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
        },
        orderBy: status === "OPEN" ? { createdAt: "asc" } : { resolvedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.questionRequest.count({ where }),
    ]);

    const requests = rows.map(({ tutorProfile, ...r }) => ({ ...r, tutor: tutorProfile.user }));

    return NextResponse.json({ requests, total, page, pageSize });
  } catch (error) {
    console.error("Error listing question requests:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
