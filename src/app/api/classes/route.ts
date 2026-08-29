import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { browseClassesWhere, myClassesWhere, learnerClassInclude, toLearnerClassDTO } from "@/lib/classQueries";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// ─── GET: Paginated Browsable / Enrolled Classes for a Learner ───────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reinstateExpiredClasses();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") === "mine" ? "mine" : "browse";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const browseWhere = browseClassesWhere(session.user.id);
    const mineWhere = myClassesWhere(session.user.id);
    const where = scope === "mine" ? mineWhere : browseWhere;

    const [browseCount, mineCount, rows] = await Promise.all([
      prisma.tutorClass.count({ where: browseWhere }),
      prisma.tutorClass.count({ where: mineWhere }),
      prisma.tutorClass.findMany({
        where,
        include: learnerClassInclude(session.user.id),
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      classes: rows.map(toLearnerClassDTO),
      page,
      pageSize,
      total: scope === "mine" ? mineCount : browseCount,
      counts: { browse: browseCount, mine: mineCount },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
