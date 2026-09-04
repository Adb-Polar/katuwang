import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { requestTopicCertificationSchema } from "@/lib/validations/topicCertification";
import { topicExists } from "@/lib/subjects";

// ─── GET: List the Tutor's Topic Certifications ───────────────────────────────
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

    const [certifications, classes] = await Promise.all([
      prisma.topicCertification.findMany({
        where: { tutorProfileId: tutorProfile.id },
        orderBy: { requestedAt: "desc" },
      }),
      prisma.tutorClass.findMany({
        where: { tutorProfileId: tutorProfile.id },
        select: { id: true, subject: true, status: true, topics: { select: { topic: true } } },
      }),
    ]);

    // Map "SUBJECT::topic" -> the tutor's own classes covering that topic, so the
    // Assessments page can show where each certification is actually being used.
    const classesByTopic = new Map<string, { id: string; subject: string; status: string }[]>();
    for (const c of classes) {
      for (const t of c.topics) {
        const key = `${c.subject}::${t.topic}`;
        const existing = classesByTopic.get(key) ?? [];
        existing.push({ id: c.id, subject: c.subject, status: c.status });
        classesByTopic.set(key, existing);
      }
    }

    return NextResponse.json(
      certifications.map((c) => ({
        ...c,
        usedInClasses: classesByTopic.get(`${c.subject}::${c.topic}`) ?? [],
      }))
    );
  } catch (error) {
    console.error("Error fetching topic certifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── POST: Request an Assessment for a Topic ───────────────────────────────────
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const result = requestTopicCertificationSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topic } = result.data;

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

    const existing = await prisma.topicCertification.findUnique({
      where: key,
      select: { status: true },
    });

    // Already certified → idempotent no-op, never downgrade an earned badge.
    if (existing?.status === "CERTIFIED") {
      return NextResponse.json(existing, { status: 200 });
    }

    // New request, or re-requesting after a PENDING/REJECTED outcome → (re)open as PENDING.
    const certification = await prisma.topicCertification.upsert({
      where: key,
      update: {
        status: "PENDING",
        requestedAt: new Date(),
        reviewedAt: null,
        reviewNote: null,
        certifiedAt: null,
      },
      create: {
        tutorProfileId: tutorProfile.id,
        subject: subject,
        topic,
        status: "PENDING",
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Error requesting topic certification:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
