import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SubjectArea, TopicCertificationStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: List Topic Certification Requests (tabbed / filtered / sorted) ──────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status: TopicCertificationStatus =
      statusParam && statusParam in TopicCertificationStatus
        ? (statusParam as TopicCertificationStatus)
        : "PENDING";
    const q = searchParams.get("q")?.trim() || "";
    const subject = searchParams.get("subject");
    const sort = searchParams.get("sort") || "requested";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.TopicCertificationWhereInput = {
      status,
      ...(subject && subject in SubjectArea ? { subject: subject as SubjectArea } : {}),
      ...(q
        ? {
            OR: [
              { topic: { contains: q } },
              { tutorProfile: { user: { anonymousId: { contains: q } } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TopicCertificationOrderByWithRelationInput =
      sort === "subject"
        ? { subject: "asc" }
        : sort === "certified"
        ? { certifiedAt: "desc" }
        : { requestedAt: status === "CERTIFIED" ? "desc" : "asc" };

    const [rows, total] = await Promise.all([
      prisma.topicCertification.findMany({
        where,
        include: {
          tutorProfile: {
            select: {
              user: { select: { id: true, anonymousId: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.topicCertification.count({ where }),
    ]);

    return NextResponse.json({
      certifications: rows.map(({ tutorProfile, ...c }) => ({ ...c, tutor: tutorProfile.user })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
