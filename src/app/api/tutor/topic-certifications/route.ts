import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestTopicCertificationSchema } from "@/lib/validations/topicCertification";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";

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

    const certifications = await prisma.topicCertification.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(certifications);
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

    if (!SUBJECT_TOPICS[subject].includes(topic)) {
      return NextResponse.json(
        { error: `"${topic}" is not a valid topic for ${subject}.` },
        { status: 400 }
      );
    }

    const certification = await prisma.topicCertification.upsert({
      where: {
        tutorProfileId_subject_topic: {
          tutorProfileId: tutorProfile.id,
          subject,
          topic,
        },
      },
      update: {},
      create: {
        tutorProfileId: tutorProfile.id,
        subject,
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
