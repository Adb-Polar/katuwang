import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SubjectArea, TopicRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: List/search all topic requests platform-wide ──────────────────────
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
    const scope = searchParams.get("scope"); // "public" | "directed"
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));

    const where: Prisma.TopicRequestWhereInput = {
      ...(subject && subject in SubjectArea ? { subject: subject as SubjectArea } : {}),
      ...(status && status in TopicRequestStatus ? { status: status as TopicRequestStatus } : {}),
      ...(scope === "public" ? { directedTutorProfileId: null } : {}),
      ...(scope === "directed" ? { directedTutorProfileId: { not: null } } : {}),
      ...(q
        ? {
            OR: [
              { learner: { firstName: { contains: q } } },
              { learner: { lastName: { contains: q } } },
              { learner: { anonymousId: { contains: q } } },
              { topics: { some: { topic: { contains: q } } } },
            ],
          }
        : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.topicRequest.findMany({
        where,
        include: {
          topics: { select: { topic: true } },
          learner: { select: { id: true, anonymousId: true, firstName: true, lastName: true } },
          directedTutor: { select: { user: { select: { id: true, anonymousId: true } } } },
          fulfilledClass: {
            select: {
              id: true,
              code: true,
              status: true,
              sessions: {
                where: { status: "SCHEDULED" },
                orderBy: { scheduledAt: "asc" },
                take: 1,
                select: { scheduledAt: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.topicRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        subject: r.subject,
        gradeLevel: r.gradeLevel,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
        topics: r.topics.map((t) => t.topic),
        learner: r.learner,
        directedTo: r.directedTutor
          ? { id: r.directedTutor.user.id, anonymousId: r.directedTutor.user.anonymousId }
          : null,
        fulfilledClass: r.fulfilledClass
          ? {
              id: r.fulfilledClass.id,
              code: r.fulfilledClass.code,
              status: r.fulfilledClass.status,
              nextSessionAt: r.fulfilledClass.sessions[0]?.scheduledAt ?? null,
            }
          : null,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching admin topic request list:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
