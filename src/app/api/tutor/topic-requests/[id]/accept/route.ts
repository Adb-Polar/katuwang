import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { acceptTopicRequestSchema } from "@/lib/validations/match";
import { normalizeTopic } from "@/lib/subjectTopics";
import { hasInternalOverlap, hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";
import { generateClassCode } from "@/lib/idGenerator";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import { requestSnapshot, recordRequestHistory } from "@/lib/topicRequestHistory";
import { isStudentEligibleForTutor, isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";
import { notify } from "@/lib/notifications";

// ─── POST: Accept an open topic request by auto-creating a class ────────────
// Replaces the old "fulfill an existing class" flow. The request stays linked
// (status ACCEPTED) until the learner enrolls (→ ENROLLED) or the class is
// cancelled/completed. The learner is NOT enrolled here.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveServerSession();
    const { id } = await params;

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await getSetting("matchingEnabled"))) {
      return NextResponse.json({ error: "Matching is currently unavailable." }, { status: 403 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { gradeLevel: true } } },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = acceptTopicRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const request = await prisma.topicRequest.findUnique({
      where: { id },
      select: { id: true, status: true, subject: true, learnerId: true, gradeLevel: true, expiresAt: true },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (request.status !== "OPEN" || request.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 400 });
    }

    const tutorGrade = tutorProfile.user?.gradeLevel ?? session.user.gradeLevel ?? null;

    if (!isStudentEligibleForTutor(request.gradeLevel, tutorGrade)) {
      return NextResponse.json(
        { error: "You cannot teach students in a higher grade level than your own." },
        { status: 403 }
      );
    }

    const certifiedTopics = await prisma.topicCertification.findMany({
      where: { tutorProfileId: tutorProfile.id, status: "CERTIFIED" },
      select: { subject: true, topic: true },
    });

    const eligible = await prisma.topicRequest.findFirst({
      where: { id, ...tutorPoolWhere(tutorProfile.id, certifiedTopics, tutorGrade) },
      select: { id: true },
    });
    if (!eligible) {
      return NextResponse.json(
        { error: "You are not eligible to accept this request." },
        { status: 403 }
      );
    }

    const { subject, gradeLevel, description, maxStudents, building, room, meetingLink, sessions } =
      result.data;

    if (gradeLevel && !isTargetGradeEligibleForTutor(gradeLevel, tutorProfile.user.gradeLevel)) {
      return NextResponse.json(
        { error: "Target grade cannot be higher than your current grade level." },
        { status: 400 }
      );
    }

    if (subject !== request.subject) {
      return NextResponse.json(
        { error: "The class subject must match the request's subject." },
        { status: 400 }
      );
    }

    // Normalize + de-duplicate topics (case-insensitive), same as class creation.
    const canonicalByKey = new Map<string, string>();
    for (const raw of result.data.topics) {
      const t = normalizeTopic(raw);
      if (t.length < 2) continue;
      const key = t.toLowerCase();
      if (!canonicalByKey.has(key)) canonicalByKey.set(key, t);
    }
    const topics = [...canonicalByKey.values()];
    if (topics.length === 0) {
      return NextResponse.json({ error: "Please select at least one topic." }, { status: 400 });
    }

    const sessionTopics = sessions.map((s) => canonicalByKey.get(normalizeTopic(s.topic).toLowerCase()));
    if (sessionTopics.some((t) => t === undefined)) {
      return NextResponse.json(
        { error: "Every session's topic must be one of the class's selected topics." },
        { status: 400 }
      );
    }

    // Hard rule regardless of `requireCertificationForClassCreation`: every
    // topic accepted into a class from a topic request must be certified.
    const certifiedTopicSet = new Set(
      certifiedTopics.filter((c) => c.subject === subject).map((c) => c.topic)
    );
    const uncertifiedTopics = topics.filter((t) => !certifiedTopicSet.has(t));
    if (uncertifiedTopics.length > 0) {
      return NextResponse.json(
        { error: `You are not certified for: ${uncertifiedTopics.join(", ")}.` },
        { status: 400 }
      );
    }

    const parsedSessions = sessions.map((s, i) => ({
      topic: sessionTopics[i] as string,
      start: new Date(s.scheduledAt),
      duration: s.duration,
    }));

    if (parsedSessions.some((s) => s.start.getTime() < Date.now())) {
      return NextResponse.json(
        { error: "Cannot schedule a session in the past." },
        { status: 400 }
      );
    }

    if (hasInternalOverlap(parsedSessions.map((s) => ({ scheduledAt: s.start, duration: s.duration })))) {
      return NextResponse.json(
        { error: "Two or more of the submitted sessions overlap each other." },
        { status: 409 }
      );
    }

    for (const s of parsedSessions) {
      const end = new Date(s.start.getTime() + s.duration * MINUTE_MS);
      const conflict = await hasSessionOverlap(tutorProfile.id, s.start, end);
      if (conflict) {
        return NextResponse.json(
          { error: "Time conflict detected: You already have a session scheduled during this time." },
          { status: 409 }
        );
      }
    }

    const code = await generateClassCode();

    const { newClass, updatedRequest } = await prisma.$transaction(async (tx) => {
      const current = await tx.topicRequest.findUniqueOrThrow({ where: { id }, select: { status: true, expiresAt: true } });
      if (current.status !== "OPEN" || current.expiresAt <= new Date()) throw new Error("Request expired before acceptance.");
      const newClass = await tx.tutorClass.create({
        data: {
          tutorProfileId: tutorProfile.id,
          code,
          subject,
          gradeLevel: gradeLevel ?? null,
          topics: { create: topics.map((topic) => ({ topic })) },
          description: description || null,
          maxStudents,
          building: building || null,
          room: room || null,
          meetingLink: meetingLink || null,
          status: "SCHEDULED",
          published: true,
          sessions: {
            create: parsedSessions.map((s) => ({
              topic: s.topic,
              scheduledAt: s.start,
              duration: s.duration,
            })),
          },
        },
      });

      if (current.expiresAt <= new Date()) throw new Error("Request expired before acceptance.");
      const before = await requestSnapshot(tx, id);
      const updatedRequest = await tx.topicRequest.update({
        where: { id },
        data: { status: "ACCEPTED", fulfilledClassId: newClass.id },
        select: { id: true, status: true, fulfilledClassId: true },
      });

      await recordRequestHistory(tx, id, session.user.id, "STATUS_CHANGED", before);
      await notify(
        tx,
        request.learnerId,
        "TOPIC_REQUEST_ACCEPTED",
        `A tutor created a class for your ${subject} request. Review it and enroll.`,
        `/learner/classes/${newClass.id}`
      );

      return { newClass, updatedRequest };
    });

    return NextResponse.json({ request: updatedRequest, classId: newClass.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Request expired before acceptance.") return NextResponse.json({ error: "This request has expired." }, { status: 409 });
    console.error("Error accepting topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
