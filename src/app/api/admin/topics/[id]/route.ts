import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { invalidateSubjectCache } from "@/lib/subjects";
import { updateTopicSchema } from "@/lib/validations/subject";
import { normalizeTopic } from "@/lib/subjectTopics";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

/** Rows across every denormalised `topic` string column for one (slug, name). */
async function topicUsageCount(slug: string, name: string): Promise<number> {
  const counts = await Promise.all([
    prisma.classTopic.count({ where: { topic: name, class: { subject: slug } } }),
    prisma.classSession.count({ where: { topic: name, class: { subject: slug } } }),
    prisma.topicRequestTopic.count({ where: { topic: name, request: { subject: slug } } }),
    prisma.topicCertification.count({ where: { subject: slug, topic: name } }),
    prisma.assessmentQuestion.count({ where: { subject: slug, topic: name } }),
    prisma.assessmentAttempt.count({ where: { subject: slug, topic: name } }),
    prisma.questionRequest.count({ where: { subject: slug, topic: name } }),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

/** Rename the denormalised `topic` string everywhere it's stored. */
async function renameTopicEverywhere(
  tx: Prisma.TransactionClient,
  slug: string,
  from: string,
  to: string
): Promise<void> {
  await tx.classTopic.updateMany({ where: { topic: from, class: { subject: slug } }, data: { topic: to } });
  await tx.classSession.updateMany({ where: { topic: from, class: { subject: slug } }, data: { topic: to } });
  await tx.topicRequestTopic.updateMany({
    where: { topic: from, request: { subject: slug } },
    data: { topic: to },
  });
  await tx.topicCertification.updateMany({ where: { subject: slug, topic: from }, data: { topic: to } });
  await tx.assessmentQuestion.updateMany({ where: { subject: slug, topic: from }, data: { topic: to } });
  await tx.assessmentAttempt.updateMany({ where: { subject: slug, topic: from }, data: { topic: to } });
  await tx.questionRequest.updateMany({ where: { subject: slug, topic: from }, data: { topic: to } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { subject: { select: { slug: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = updateTopicSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid inputs." },
        { status: 400 }
      );
    }

    const data = { ...result.data };
    const renameTo = data.name ? normalizeTopic(data.name) : undefined;
    if (renameTo) data.name = renameTo;

    if (renameTo && renameTo !== existing.name) {
      const clash = await prisma.topic.findFirst({
        where: { subjectId: existing.subjectId, name: renameTo, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Another topic in this subject already uses that name." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (renameTo && renameTo !== existing.name) {
        await renameTopicEverywhere(tx, existing.subject.slug, existing.name, renameTo);
      }
      const row = await tx.topic.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.TOPIC_UPDATED,
          targetType: AUDIT_TARGET_TYPES.TOPIC,
          targetId: id,
          reason: `${existing.subject.slug} · ${existing.name} -> ${JSON.stringify(data)}`,
        },
      });
      return row;
    });

    invalidateSubjectCache();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { subject: { select: { slug: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    }

    const usage = await topicUsageCount(existing.subject.slug, existing.name);
    const soft = usage > 0;

    await prisma.$transaction(async (tx) => {
      if (soft) {
        await tx.topic.update({ where: { id }, data: { active: false } });
      } else {
        await tx.topic.delete({ where: { id } });
      }
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.TOPIC_DELETED,
          targetType: AUDIT_TARGET_TYPES.TOPIC,
          targetId: id,
          reason: `${existing.subject.slug} · ${existing.name}${soft ? ` (soft — ${usage} in use)` : ""}`,
        },
      });
    });

    invalidateSubjectCache();
    return NextResponse.json({
      message: soft ? "Topic is in use — deactivated instead of deleted." : "Topic deleted.",
      soft,
    });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
