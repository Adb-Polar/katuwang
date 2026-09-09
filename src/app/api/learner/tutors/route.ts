import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { reinstateExpiredClasses } from "@/lib/moderation";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

// ─── GET: Browsable tutors (learner-facing, anonymized) ────────────────────
// A tutor is worth browsing once they hold at least one CERTIFIED topic. Real
// names are withheld unless the `showTutorRealNames` platform setting is on.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reinstateExpiredClasses();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    // `subjects` is a comma-separated slug list (multi-select); `subject` is the
    // legacy single-value param, still accepted.
    const subjectsParam = searchParams.get("subjects")?.trim() || "";
    const legacySubject = searchParams.get("subject")?.trim() || "";
    const subjectSlugs = (subjectsParam ? subjectsParam.split(",") : legacySubject ? [legacySubject] : [])
      .map((s) => s.trim())
      .filter(Boolean);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const showRealNames = await getSetting("showTutorRealNames");

    const where: Prisma.UserWhereInput = {
      role: "STUDENT_TUTOR",
      status: "ACTIVE",
      // Multi-select is AND: the tutor must be CERTIFIED in every chosen subject.
      tutorProfile:
        subjectSlugs.length > 0
          ? {
              AND: subjectSlugs.map((s) => ({
                topicCertifications: { some: { status: "CERTIFIED", subject: s } },
              })),
            }
          : { topicCertifications: { some: { status: "CERTIFIED" } } },
      ...(q ? { anonymousId: { contains: q } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          anonymousId: true,
          ...(showRealNames ? { firstName: true, lastName: true, section: true } : {}),
          tutorProfile: {
            select: {
              topicCertifications: {
                where: { status: "CERTIFIED" },
                select: { subject: true, topic: true },
              },
              _count: { select: { classes: { where: { published: true } } } },
              classes: {
                where: { published: true, status: "SCHEDULED" },
                select: {
                  code: true,
                  subject: true,
                  topics: { select: { topic: true } },
                  sessions: {
                    where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
                    orderBy: { scheduledAt: "asc" },
                    take: 1,
                    select: { scheduledAt: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { anonymousId: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const tutors = rows.map((u) => {
      const certs = u.tutorProfile?.topicCertifications ?? [];
      const subjects = [...new Set(certs.map((c) => c.subject))].sort();
      const classes = u.tutorProfile?.classes ?? [];
      const upcoming = classes
        .flatMap((c) => c.sessions.map((s) => s.scheduledAt))
        .sort((a, b) => a.getTime() - b.getTime());

      // A class is "verified" when at least one of its topics is a CERTIFIED
      // topic for the tutor in that class's subject.
      const certKey = new Set(certs.map((c) => `${c.subject}::${c.topic}`));
      const verifiedClasses = classes
        .filter((c) => (c.topics ?? []).some((t) => certKey.has(`${c.subject}::${t.topic}`)))
        .map((c) => ({ code: c.code, subject: c.subject }));

      return {
        id: u.id,
        anonymousId: u.anonymousId,
        ...(showRealNames && "firstName" in u
          ? { name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(), section: u.section }
          : {}),
        verifiedTopicCount: certs.length,
        subjects,
        verifiedClasses,
        publishedClassCount: u.tutorProfile?._count.classes ?? 0,
        nextSessionAt: upcoming[0]?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ tutors, total, page, pageSize });
  } catch (error) {
    console.error("Error listing tutors:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
