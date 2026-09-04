import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { invalidateSubjectCache } from "@/lib/subjects";
import { updateSubjectSchema } from "@/lib/validations/subject";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

/** How many rows across the 6 `subject`-bearing models reference this slug. */
async function subjectUsageCount(slug: string): Promise<number> {
  const [a, b, c, d, e, f] = await Promise.all([
    prisma.tutorClass.count({ where: { subject: slug } }),
    prisma.topicRequest.count({ where: { subject: slug } }),
    prisma.topicCertification.count({ where: { subject: slug } }),
    prisma.assessmentQuestion.count({ where: { subject: slug } }),
    prisma.assessmentAttempt.count({ where: { subject: slug } }),
    prisma.questionRequest.count({ where: { subject: slug } }),
  ]);
  return a + b + c + d + e + f;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = updateSubjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid inputs." },
        { status: 400 }
      );
    }

    if (result.data.name && result.data.name !== existing.name) {
      const clash = await prisma.subject.findFirst({
        where: { name: result.data.name, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json({ error: "Another subject already uses that name." }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.subject.update({ where: { id }, data: result.data });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.SUBJECT_UPDATED,
          targetType: AUDIT_TARGET_TYPES.SUBJECT,
          targetId: id,
          reason: `${row.slug} — ${JSON.stringify(result.data)}`,
        },
      });
      return row;
    });

    invalidateSubjectCache();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating subject:", error);
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

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const usage = await subjectUsageCount(existing.slug);
    if (usage > 0) {
      return NextResponse.json(
        {
          error: `This subject is used by ${usage} record(s) (classes, requests, questions, or certifications). Deactivate it instead of deleting.`,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.subject.delete({ where: { id } }); // cascades to topics
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: AUDIT_ACTIONS.SUBJECT_DELETED,
          targetType: AUDIT_TARGET_TYPES.SUBJECT,
          targetId: id,
          reason: `${existing.slug} — ${existing.name}`,
        },
      });
    });

    invalidateSubjectCache();
    return NextResponse.json({ message: "Subject deleted." });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
