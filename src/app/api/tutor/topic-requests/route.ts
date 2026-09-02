import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SubjectArea } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: Open topic requests a tutor can respond to ─────────────────────────
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
    const subject = searchParams.get("subject");
    const mine = searchParams.get("mine") !== "false"; // default: only my subjects
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));

    const where: Prisma.TopicRequestWhereInput = { status: "OPEN" };

    if (subject && subject in SubjectArea) {
      where.subject = subject as SubjectArea;
    } else if (mine) {
      const [classSubjects, certSubjects] = await Promise.all([
        prisma.tutorClass.findMany({
          where: { tutorProfileId: tutorProfile.id },
          select: { subject: true },
          distinct: ["subject"],
        }),
        prisma.topicCertification.findMany({
          where: { tutorProfileId: tutorProfile.id },
          select: { subject: true },
          distinct: ["subject"],
        }),
      ]);
      const subjects = [...new Set([...classSubjects, ...certSubjects].map((r) => r.subject))];
      where.subject = { in: subjects.length > 0 ? subjects : ["__none__" as SubjectArea] };
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
        orderBy: { createdAt: "asc" },
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
