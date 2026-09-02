import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, ClassTestKind, ClassTestStatus, SubjectArea } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: All Class Tests (read-only, paginated) ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const kindParam = searchParams.get("kind");
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.ClassTestWhereInput = {
      ...(kindParam && kindParam in ClassTestKind ? { kind: kindParam as ClassTestKind } : {}),
      ...(statusParam && statusParam in ClassTestStatus
        ? { status: statusParam as ClassTestStatus }
        : {}),
      ...(subject && subject in SubjectArea ? { class: { subject: subject as SubjectArea } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { class: { code: { contains: q } } },
              { class: { tutorProfile: { user: { anonymousId: { contains: q } } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.classTest.findMany({
        where,
        include: {
          class: {
            select: {
              code: true,
              subject: true,
              tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
            },
          },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.classTest.count({ where }),
    ]);

    const tests = rows.map(({ class: c, _count, ...t }) => ({
      ...t,
      classCode: c.code,
      subject: c.subject,
      tutor: c.tutorProfile.user,
      questionCount: _count.questions,
      attemptCount: _count.attempts,
    }));

    return NextResponse.json({ tests, total, page, pageSize });
  } catch (error) {
    console.error("Error listing class tests (admin):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
