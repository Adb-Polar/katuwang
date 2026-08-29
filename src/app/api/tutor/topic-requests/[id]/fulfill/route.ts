import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { fulfillTopicRequestSchema } from "@/lib/validations/match";

// ─── POST: Attach one of the tutor's classes to an open request ─────────────
// The learner is NOT enrolled here — they review the class and enroll themselves.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await getSetting("matchingEnabled"))) {
      return NextResponse.json({ error: "Matching is currently unavailable." }, { status: 403 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = fulfillTopicRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const { classId } = result.data;

    const request = await prisma.topicRequest.findUnique({
      where: { id },
      select: { id: true, status: true, subject: true },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (request.status !== "OPEN") {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 400 });
    }

    const tutorClass = await prisma.tutorClass.findUnique({
      where: { id: classId },
      select: { id: true, tutorProfileId: true, status: true, subject: true },
    });
    if (!tutorClass || tutorClass.tutorProfileId !== tutorProfile.id) {
      return NextResponse.json({ error: "You can only attach one of your own classes." }, { status: 403 });
    }
    if (tutorClass.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Only a scheduled class can be attached." }, { status: 400 });
    }
    if (tutorClass.subject !== request.subject) {
      return NextResponse.json(
        { error: "The class subject must match the request's subject." },
        { status: 400 }
      );
    }

    const updated = await prisma.topicRequest.update({
      where: { id },
      data: { status: "FULFILLED", fulfilledClassId: classId },
      select: { id: true, status: true, fulfilledClassId: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error fulfilling topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
