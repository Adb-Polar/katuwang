import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SubjectArea, GradeLevel } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { getSetting } from "@/lib/settings";
import { browseClassesWhere, myClassesWhere, learnerClassInclude, toLearnerClassDTO } from "@/lib/classQueries";
import { rankBrowseClasses, BrowseRankContext } from "@/lib/browseRanking";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

/**
 * The signals used to personalize the default browse order: the learner's grade
 * plus the subjects/topics they've engaged with (past enrolments + open requests).
 */
async function loadRankContext(learnerId: string): Promise<BrowseRankContext> {
  const [user, enrollments, requests] = await Promise.all([
    prisma.user.findUnique({ where: { id: learnerId }, select: { gradeLevel: true } }),
    prisma.classEnrollment.findMany({
      where: { learnerId },
      select: { class: { select: { subject: true, topics: { select: { topic: true } } } } },
    }),
    prisma.topicRequest.findMany({
      where: { learnerId, status: "OPEN" },
      select: { subject: true, topics: { select: { topic: true } } },
    }),
  ]);

  const interestSubjects = new Set<string>();
  const interestTopics = new Set<string>();
  for (const e of enrollments) {
    interestSubjects.add(e.class.subject);
    for (const t of e.class.topics) interestTopics.add(t.topic);
  }
  for (const r of requests) {
    interestSubjects.add(r.subject);
    for (const t of r.topics) interestTopics.add(t.topic);
  }

  return { gradeLevel: user?.gradeLevel ?? null, interestSubjects, interestTopics };
}

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

    // Search/subject/grade filters (privacy-safe: subject/topic text + anonymised
    // tutor ID only). Applied to both scopes.
    const q = searchParams.get("q")?.trim() || "";
    const subjectParam = searchParams.get("subject");
    const gradeParam = searchParams.get("gradeLevel");

    const listFilters: Prisma.TutorClassWhereInput = {
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
    const hasFilters = Object.keys(listFilters).length > 0;

    // My-Classes status tabs.
    const MINE_TAB_WHERE = {
      upcoming: { status: { in: ["SCHEDULED", "SUSPENDED"] } },
      completed: { status: "COMPLETED" },
      cancelled: { status: { in: ["CANCELLED", "BANNED"] } },
    } as const;
    type MineTab = keyof typeof MINE_TAB_WHERE;
    const tabParam = searchParams.get("status");
    const mineTab: MineTab =
      tabParam === "completed" || tabParam === "cancelled" ? tabParam : "upcoming";

    const browseWhere = browseClassesWhere(session.user.id);
    const mineWhere = myClassesWhere(session.user.id);
    const filteredBrowse = scope === "browse" && hasFilters;
    // The unfiltered browse list is ranked by light personalization (see
    // `rankBrowseClasses`); a filtered browse or the "mine" scope stays newest-first.
    const personalize = scope === "browse" && !hasFilters;

    const where: Prisma.TutorClassWhereInput =
      scope === "mine"
        ? {
            AND: [
              mineWhere,
              MINE_TAB_WHERE[mineTab] as Prisma.TutorClassWhereInput,
              ...(hasFilters ? [listFilters] : []),
            ],
          }
        : filteredBrowse
        ? { AND: [browseWhere, listFilters] }
        : browseWhere;

    const mineTabCount = (tab: MineTab) =>
      prisma.tutorClass.count({
        where: { AND: [mineWhere, MINE_TAB_WHERE[tab] as Prisma.TutorClassWhereInput] },
      });

    const [
      browseCount,
      mineUpcoming,
      mineCompleted,
      mineCancelled,
      scopeTotal,
      rows,
      showRealNames,
      rankContext,
    ] = await Promise.all([
      prisma.tutorClass.count({ where: browseWhere }),
      mineTabCount("upcoming"),
      mineTabCount("completed"),
      mineTabCount("cancelled"),
      scope === "mine" || filteredBrowse
        ? prisma.tutorClass.count({ where })
        : Promise.resolve(0),
      prisma.tutorClass.findMany({
        where,
        include: learnerClassInclude(session.user.id),
        orderBy: { createdAt: "desc" },
        // Personalized browse ranks in JS, so it needs the full result set.
        ...(personalize ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
      getSetting("showTutorRealNames"),
      personalize ? loadRankContext(session.user.id) : Promise.resolve(null),
    ]);

    const mineTotal = mineUpcoming + mineCompleted + mineCancelled;

    let dtos = rows.map((r) => toLearnerClassDTO(r, showRealNames));
    if (personalize && rankContext) {
      dtos = rankBrowseClasses(rankContext, dtos).slice((page - 1) * pageSize, page * pageSize);
    }

    return NextResponse.json({
      classes: dtos,
      page,
      pageSize,
      total: scope === "mine" ? scopeTotal : filteredBrowse ? scopeTotal : browseCount,
      counts: {
        browse: browseCount,
        mine: mineTotal,
        mineTabs: { upcoming: mineUpcoming, completed: mineCompleted, cancelled: mineCancelled },
      },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
