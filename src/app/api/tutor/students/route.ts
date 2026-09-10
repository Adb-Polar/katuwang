import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, GradeLevel } from "@prisma/client";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

interface StudentEntry {
  id: string;
  anonymousId: string;
  gradeLevel: GradeLevel;
  section: string;
  enrollments: {
    classId: string;
    code: string;
    subject: string;
    topics: string[];
    enrolledAt: Date;
  }[];
}

// ─── GET: Aggregate Roster Across All of the Tutor's Classes ──────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get("gradeLevel");
    const section = searchParams.get("section")?.trim() || "";
    const subject = searchParams.get("subject");
    const classId = searchParams.get("classId");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));

    const where: Prisma.ClassEnrollmentWhereInput = {
      class: {
        tutorProfileId: tutorProfile.id,
        ...(subject ? { subject } : {}),
        ...(classId ? { id: classId } : {}),
      },
      ...(gradeLevel || section || q
        ? {
            learner: {
              ...(gradeLevel && gradeLevel in GradeLevel ? { gradeLevel: gradeLevel as GradeLevel } : {}),
              ...(section ? { section: { contains: section } } : {}),
              ...(q ? { anonymousId: { contains: q } } : {}),
            },
          }
        : {}),
    };

    const enrollments = await prisma.classEnrollment.findMany({
      where,
      select: {
        enrolledAt: true,
        class: { select: { id: true, code: true, subject: true, topics: { select: { topic: true } } } },
        learner: { select: { id: true, anonymousId: true, gradeLevel: true, section: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const byLearner = new Map<string, StudentEntry>();
    for (const enr of enrollments) {
      const existing = byLearner.get(enr.learner.id);
      const entry = {
        classId: enr.class.id,
        code: enr.class.code,
        subject: enr.class.subject,
        topics: enr.class.topics.map((t) => t.topic),
        enrolledAt: enr.enrolledAt,
      };
      if (existing) {
        existing.enrollments.push(entry);
      } else {
        byLearner.set(enr.learner.id, {
          id: enr.learner.id,
          anonymousId: enr.learner.anonymousId,
          gradeLevel: enr.learner.gradeLevel,
          section: enr.learner.section,
          enrollments: [entry],
        });
      }
    }

    const students = Array.from(byLearner.values());
    const total = students.length;
    const paged = students.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({ students: paged, total, page, pageSize });
  } catch (error) {
    console.error("Error fetching tutor student roster:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
