import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

// ─── GET: Topic requests a tutor can act on ──────────────────────────────────
//   tab=open     (default) — OPEN requests this tutor is eligible to accept
//                             (directed to them, or public in a certified subject/topic)
//   tab=accepted — requests this tutor has already accepted, with the linked class
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await getSetting("matchingEnabled"))) {
      return NextResponse.json({ error: "Matching is currently unavailable." }, { status: 403 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const tabParam = searchParams.get("tab");
    // "open" family: open | public (open, not directed) | directed (open, to me)
    const tab: "accepted" | "open" | "public" | "directed" =
      tabParam === "accepted"
        ? "accepted"
        : tabParam === "public"
          ? "public"
          : tabParam === "directed"
            ? "directed"
            : "open";
    const subject = searchParams.get("subject");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));

    if (tab === "accepted") {
      const where: Prisma.TopicRequestWhereInput = {
        status: { in: ["ACCEPTED", "ENROLLED"] },
        fulfilledClass: { tutorProfileId: tutorProfile.id },
        ...(subject ? { subject } : {}),
      };

      const [total, requests] = await Promise.all([
        prisma.topicRequest.count({ where }),
        prisma.topicRequest.findMany({
          where,
          include: {
            topics: { select: { topic: true } },
            learner: { select: { anonymousId: true, gradeLevel: true, section: true } },
            fulfilledClass: {
              select: {
                id: true,
                sessions: {
                  where: { status: "SCHEDULED" },
                  orderBy: { scheduledAt: "asc" },
                  take: 1,
                  select: { scheduledAt: true },
                },
                _count: { select: { enrollments: true } },
                maxStudents: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return NextResponse.json({
        requests: requests.map((r) => ({
          id: r.id,
          subject: r.subject,
          gradeLevel: r.gradeLevel,
          status: r.status,
          topics: r.topics.map((t) => t.topic),
          learner: r.learner,
          class: r.fulfilledClass
            ? {
                id: r.fulfilledClass.id,
                nextSessionAt: r.fulfilledClass.sessions[0]?.scheduledAt ?? null,
                enrolledCount: r.fulfilledClass._count.enrollments,
                maxStudents: r.fulfilledClass.maxStudents,
              }
            : null,
        })),
        total,
        page,
        pageSize,
      });
    }

    // ── tab=open ────────────────────────────────────────────────────────────
    const certifiedTopics = await prisma.topicCertification.findMany({
      where: { tutorProfileId: tutorProfile.id, status: "CERTIFIED" },
      select: { subject: true, topic: true },
    });

    let where = tutorPoolWhere(tutorProfile.id, certifiedTopics);
    if (subject) {
      where = { ...where, subject };
    }
    if (tab === "directed") {
      where = { ...where, directedTutorProfileId: tutorProfile.id };
    } else if (tab === "public") {
      where = { ...where, directedTutorProfileId: null };
    }

    const [total, requests] = await Promise.all([
      prisma.topicRequest.count({ where }),
      prisma.topicRequest.findMany({
        where,
        include: {
          topics: { select: { topic: true } },
          slots: { select: { day: true, startTime: true, endTime: true } },
          learner: { select: { anonymousId: true, gradeLevel: true, section: true } },
        },
        orderBy: [{ directedTutorProfileId: "desc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        subject: r.subject,
        gradeLevel: r.gradeLevel,
        note: r.note,
        createdAt: r.createdAt,
        topics: r.topics.map((t) => t.topic),
        slots: r.slots,
        learner: r.learner,
        directed: r.directedTutorProfileId === tutorProfile.id,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching tutor topic requests:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
