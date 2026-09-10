import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAssessmentQuestionSchema } from "@/lib/validations/assessment";
import { topicExists } from "@/lib/subjects";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE;

// ─── GET: List Bank Questions (filtered / paginated) ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic")?.trim() || "";
    const activeParam = searchParams.get("active");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.AssessmentQuestionWhereInput = {
      origin: "BANK", // tutor-authored custom questions never appear in the admin bank
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(activeParam === "true" ? { active: true } : activeParam === "false" ? { active: false } : {}),
      ...(q ? { prompt: { contains: q } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessmentQuestion.findMany({
        where,
        include: {
          options: { orderBy: { position: "asc" } },
          _count: { select: { attemptItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.assessmentQuestion.count({ where }),
    ]);

    const questions = rows.map(({ _count, ...q }) => ({ ...q, inUse: _count.attemptItems > 0 }));

    return NextResponse.json({ questions, total, page, pageSize });
  } catch (error) {
    console.error("Error listing assessment questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Create a Bank Question ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = createAssessmentQuestionSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topic, prompt, explanation, options } = result.data;

    if (!(await topicExists(subject, topic))) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const question = await tx.assessmentQuestion.create({
        data: {
          subject: subject,
          topic,
          prompt,
          explanation: explanation || null,
          origin: "BANK", // admin authoring always creates bank questions
          createdById: session.user.id,
          options: {
            create: options.map((o, i) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              position: i,
            })),
          },
        },
        include: { options: { orderBy: { position: "asc" } } },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.QUESTION_CREATED,
          targetType: AUDIT_TARGET_TYPES.QUESTION,
          targetId: question.id,
          reason: `${subject} · ${topic}`,
        },
      });

      return question;
    });

    return NextResponse.json({ ...created, inUse: false }, { status: 201 });
  } catch (error) {
    console.error("Error creating assessment question:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
