import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { requestQuestionsSchema } from "@/lib/validations/assessment";
import { topicExists } from "@/lib/subjects";
import { notifyMany } from "@/lib/notifications";

// ─── GET: The Tutor's Own Question Requests ─────────────────────────────────
export async function GET() {
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

    const requests = await prisma.questionRequest.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error listing tutor question requests:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// ─── POST: Ask an Admin to Add Questions for a Topic ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { anonymousId: true } } },
    });
    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = requestQuestionsSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topic, note } = result.data;

    if (!(await topicExists(subject, topic))) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    const key = {
      tutorProfileId_subject_topic: {
        tutorProfileId: tutorProfile.id,
        subject: subject,
        topic,
      },
    };

    const existing = await prisma.questionRequest.findUnique({
      where: key,
      select: { status: true },
    });

    if (existing?.status === "OPEN") {
      return NextResponse.json(
        { message: "A request for this topic is already open.", status: "OPEN" },
        { status: 200 }
      );
    }

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.questionRequest.upsert({
        where: key,
        update: {
          status: "OPEN",
          note: note || null,
          resolvedById: null,
          resolvedAt: null,
          resolutionNote: null,
        },
        create: {
          tutorProfileId: tutorProfile.id,
          subject: subject,
          topic,
          note: note || null,
          status: "OPEN",
        },
      });

      // Let every admin know there's a new question-bank request to act on.
      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        "QUESTION_REQUEST_NEW",
        `${tutorProfile.user.anonymousId} requested assessment questions for "${topic}" (${subject}).`,
        "/admin/assessment/requests"
      );

      return created;
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("Error creating question request:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
