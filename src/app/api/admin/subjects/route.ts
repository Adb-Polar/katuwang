import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSubjectCache } from "@/lib/subjects";
import { createSubjectSchema } from "@/lib/validations/subject";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── GET: full taxonomy (subjects + topics, including inactive) ────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        topics: { orderBy: [{ order: "asc" }, { name: "asc" }] },
        _count: { select: { topics: true } },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error listing subjects:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: create a subject ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = createSubjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid inputs." },
        { status: 400 }
      );
    }
    const { name, slug } = result.data;

    const clash = await prisma.subject.findFirst({
      where: { OR: [{ slug }, { name }] },
      select: { slug: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "A subject with that name or slug already exists." },
        { status: 409 }
      );
    }

    const max = await prisma.subject.aggregate({ _max: { order: true } });

    const subject = await prisma.$transaction(async (tx) => {
      const created = await tx.subject.create({
        data: { name, slug, order: (max._max.order ?? -1) + 1 },
      });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.SUBJECT_CREATED,
          targetType: AUDIT_TARGET_TYPES.SUBJECT,
          targetId: created.id,
          reason: `${created.slug} — ${created.name}`,
        },
      });
      return created;
    });

    invalidateSubjectCache();
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
