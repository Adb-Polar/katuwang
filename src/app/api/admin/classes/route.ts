import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, ClassStatus } from "@prisma/client";
import { parseSort } from "@/lib/sortParams";

const DEFAULT_PAGE_SIZE = 10;

const CLASS_SORT_COLUMN: Record<string, "createdAt" | "code" | "subject" | "status"> = {
  createdAt: "createdAt",
  code: "code",
  subject: "subject",
  status: "status",
};

// ─── GET: List All Classes for Moderation ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const subject = searchParams.get("subject");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
    const { sort, dir } = parseSort(searchParams, Object.keys(CLASS_SORT_COLUMN), "createdAt");

    const where: Prisma.TutorClassWhereInput = {
      ...(subject ? { subject } : {}),
      ...(status && status in ClassStatus ? { status: status as ClassStatus } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { topics: { some: { topic: { contains: q } } } },
              { tutorProfile: { user: { firstName: { contains: q } } } },
              { tutorProfile: { user: { lastName: { contains: q } } } },
              { tutorProfile: { user: { anonymousId: { contains: q } } } },
            ],
          }
        : {}),
    };

    const [classes, total] = await Promise.all([
      prisma.tutorClass.findMany({
        where,
        include: {
          topics: true,
          sessions: { orderBy: { scheduledAt: "asc" } },
          tutorProfile: {
            select: {
              user: { select: { id: true, anonymousId: true, firstName: true, lastName: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { [CLASS_SORT_COLUMN[sort]]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tutorClass.count({ where }),
    ]);

    const now = new Date();
    return NextResponse.json({
      classes: classes.map(({ tutorProfile, topics, sessions = [], ...c }) => {
        const nextUpcoming = sessions.find(
          (s) => s.status === "SCHEDULED" && s.scheduledAt > now,
        );
        return {
          ...c,
          topics: topics.map((t) => t.topic),
          tutor: tutorProfile.user,
          // First upcoming scheduled session, else the earliest session, else null.
          nextSessionAt:
            nextUpcoming?.scheduledAt.toISOString() ??
            sessions[0]?.scheduledAt.toISOString() ??
            null,
        };
      }),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching admin class list:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
