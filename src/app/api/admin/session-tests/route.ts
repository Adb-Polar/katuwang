import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, SessionTestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

// ─── GET: All Session Tests (read-only, paginated) ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject")?.trim() || "";
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
    );

    const where: Prisma.SessionTestWhereInput = {
      ...(statusParam && statusParam in SessionTestStatus
        ? { status: statusParam as SessionTestStatus }
        : {}),
      ...(subject ? { session: { class: { subject } } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { session: { class: { code: { contains: q } } } },
              { session: { class: { tutorProfile: { user: { anonymousId: { contains: q } } } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.sessionTest.findMany({
        where,
        include: {
          session: {
            select: {
              scheduledAt: true,
              topic: true,
              status: true,
              class: {
                select: {
                  code: true,
                  subject: true,
                  tutorProfile: { select: { user: { select: { id: true, anonymousId: true } } } },
                },
              },
            },
          },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sessionTest.count({ where }),
    ]);

    const tests = rows.map(({ session: s, _count, ...t }) => ({
      ...t,
      classCode: s.class.code,
      subject: s.class.subject,
      sessionTopic: s.topic,
      scheduledAt: s.scheduledAt.toISOString(),
      sessionStatus: s.status,
      tutor: s.class.tutorProfile.user,
      questionCount: _count.questions,
      attemptCount: _count.attempts,
    }));

    return NextResponse.json({ tests, total, page, pageSize });
  } catch (error) {
    console.error("Error listing session tests (admin):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
