import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, AssessmentAttemptStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: List Assessment Attempts (filtered / paginated) ────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic")?.trim() || "";
    const statusParam = searchParams.get("status");
    const status =
      statusParam && statusParam in AssessmentAttemptStatus
        ? (statusParam as AssessmentAttemptStatus)
        : null;
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.AssessmentAttemptWhereInput = {
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(status ? { status } : {}),
      ...(q ? { tutorProfile: { user: { anonymousId: { contains: q } } } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where,
        include: {
          tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
        },
        orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.assessmentAttempt.count({ where }),
    ]);

    const attempts = rows.map(({ tutorProfile, ...a }) => ({ ...a, tutor: tutorProfile.user }));

    return NextResponse.json({ attempts, total, page, pageSize });
  } catch (error) {
    console.error("Error listing assessment attempts:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
