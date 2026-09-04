import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cancelTopicRequestSchema,
  createTopicRequestSchema,
  type CreateTopicRequestInput,
} from "@/lib/validations/match";
import { SubjectArea } from "@prisma/client";
import { subjectExists, topicExists } from "@/lib/subjects";

// ─── PATCH: Cancel or edit one's own topic request ───────────────────────────
//   { status: "CANCELLED" }                                  → cancel (from OPEN or ACCEPTED)
//   { subject, topics, gradeLevel, preferredSlots?, note? }  → edit criteria (OPEN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const isCancel = body && typeof body === "object" && "status" in body;

    // Validate the payload before any DB work (keeps 400s ahead of 404s).
    const parsed = isCancel
      ? cancelTopicRequestSchema.safeParse(body)
      : createTopicRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const existing = await prisma.topicRequest.findUnique({
      where: { id },
      select: { learnerId: true, status: true },
    });

    if (!existing || existing.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    // ── Cancel ──────────────────────────────────────────────────────────────
    if (isCancel) {
      if (existing.status !== "OPEN" && existing.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Only an open or accepted request can be cancelled." },
          { status: 400 }
        );
      }
      const updated = await prisma.topicRequest.update({
        where: { id },
        data: { status: "CANCELLED", fulfilledClassId: null },
        select: { id: true, status: true },
      });
      return NextResponse.json(updated);
    }

    // ── Edit criteria (OPEN only) ───────────────────────────────────────────
    if (existing.status !== "OPEN") {
      return NextResponse.json(
        { error: "Only an open request can be edited." },
        { status: 400 }
      );
    }

    const { subject, topics, gradeLevel, preferredSlots, note } =
      parsed.data as CreateTopicRequestInput;

    if (!(await subjectExists(subject))) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }
    if ((await Promise.all(topics.map((t) => topicExists(subject, t)))).some((ok) => !ok)) {
      return NextResponse.json(
        { error: `One or more topics are not valid for ${subject}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.topicRequest.update({
      where: { id },
      data: {
        subject: subject as SubjectArea,
        gradeLevel,
        note: note || null,
        topics: {
          deleteMany: {},
          create: [...new Set(topics)].map((topic) => ({ topic })),
        },
        slots: {
          deleteMany: {},
          create: (preferredSlots ?? []).map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
