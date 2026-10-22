import { certifiedBankTopics, certifiedBankWhere } from "@/lib/teachingBankAccess";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getActiveServerSession } from "@/lib/serverSession";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

// ─── GET: Browse the Admin Question Bank (for building a session test) ─────
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject")?.trim() || "";
    const topic = searchParams.get("topic")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
    );

    const certifiedTopics = await certifiedBankTopics(session.user.id);
    if (certifiedTopics.length === 0) {
      return NextResponse.json({ questions: [], total: 0, page, pageSize });
    }
    const where: Prisma.AssessmentQuestionWhereInput = {
      AND: [certifiedBankWhere(certifiedTopics)],
      origin: "BANK",
      active: true,
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(q ? { prompt: { contains: q } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessmentQuestion.findMany({
        where,
        include: { options: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.assessmentQuestion.count({ where }),
    ]);

    return NextResponse.json({ questions: rows, total, page, pageSize });
  } catch (error) {
    console.error("Error browsing question bank:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
