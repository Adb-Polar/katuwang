import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSubjectCache } from "@/lib/subjects";
import { createTopicSchema } from "@/lib/validations/subject";
import { normalizeTopic } from "@/lib/subjectTopics";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── POST: add a topic to a subject ──────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: subjectId } = await params;
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = createTopicSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid inputs." },
        { status: 400 }
      );
    }
    const name = normalizeTopic(result.data.name);

    const clash = await prisma.topic.findFirst({
      where: { subjectId, name: { equals: name } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "That topic already exists for this subject." }, { status: 409 });
    }

    const max = await prisma.topic.aggregate({ where: { subjectId }, _max: { order: true } });

    const topic = await prisma.$transaction(async (tx) => {
      const created = await tx.topic.create({
        data: { subjectId, name, order: (max._max.order ?? -1) + 1 },
      });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.TOPIC_CREATED,
          targetType: AUDIT_TARGET_TYPES.TOPIC,
          targetId: created.id,
          reason: `${subject.slug} · ${name}`,
        },
      });
      return created;
    });

    invalidateSubjectCache();
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
