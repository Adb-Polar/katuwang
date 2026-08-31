import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SubjectArea, GradeLevel } from "@prisma/client";
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

    // Browse-scope filters (privacy-safe: subject/topic text + anonymised tutor ID only).
    const q = searchParams.get("q")?.trim() || "";
    const subjectParam = searchParams.get("subject");
    const gradeParam = searchParams.get("gradeLevel");

    const browseFilters: Prisma.TutorClassWhereInput = {
      ...(subjectParam && subjectParam in SubjectArea ? { subject: subjectParam as SubjectArea } : {}),
      ...(gradeParam && gradeParam in GradeLevel ? { gradeLevel: gradeParam as GradeLevel } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { topics: { some: { topic: { contains: q } } } },
              { tutorProfile: { user: { anonymousId: { contains: q } } } },
            ],
          }
        : {}),
    };
    const hasBrowseFilters = Object.keys(browseFilters).length > 0;

    const browseWhere = browseClassesWhere(session.user.id);
    const mineWhere = myClassesWhere(session.user.id);
    const filteredBrowse = scope === "browse" && hasBrowseFilters;
    const where = scope === "mine"
      ? mineWhere
      : filteredBrowse
      ? { AND: [browseWhere, browseFilters] }
      : browseWhere;

    const [browseCount, mineCount, filteredCount, rows] = await Promise.all([
      prisma.tutorClass.count({ where: browseWhere }),
      prisma.tutorClass.count({ where: mineWhere }),
      filteredBrowse ? prisma.tutorClass.count({ where }) : Promise.resolve(0),
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
      total: scope === "mine" ? mineCount : filteredBrowse ? filteredCount : browseCount,
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
