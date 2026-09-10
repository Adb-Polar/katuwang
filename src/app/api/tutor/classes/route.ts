import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ClassStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validations/class";
import { normalizeTopic } from "@/lib/subjectTopics";
import { subjectExists } from "@/lib/subjects";
import { getSetting } from "@/lib/settings";
import { hasInternalOverlap, hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";
import { generateClassCode } from "@/lib/idGenerator";

// ─── GET: Fetch Tutor's Classes ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const classes = await prisma.tutorClass.findMany({
      where: {
        tutorProfileId: tutorProfile.id,
        ...(status && status in ClassStatus ? { status: status as ClassStatus } : {}),
      },
      include: {
        topics: true,
        sessions: { orderBy: { scheduledAt: "asc" } },
        enrollments: {
          include: {
            learner: {
              select: {
                id: true,
                anonymousId: true,
                gradeLevel: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      classes.map((c) => ({ ...c, topics: c.topics.map((t) => t.topic) }))
    );
  } catch (error) {
    console.error("Error fetching tutor classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── POST: Create a New Class (with its initial sessions) ─────────────────────
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
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, gradeLevel, description, maxStudents, building, room, meetingLink, sessions } =
      result.data;

    if (!(await subjectExists(subject))) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }

    // Normalize + de-duplicate topics (case-insensitive). Custom topics that
    // aren't in the curated SUBJECT_TOPICS list are allowed — a tutor can teach
    // something the catalog doesn't list yet; they're stored verbatim.
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

    // Every session's topic must resolve to one of the class's chosen topics.
    const sessionTopics = sessions.map((s) => canonicalByKey.get(normalizeTopic(s.topic).toLowerCase()));
    if (sessionTopics.some((t) => t === undefined)) {
      return NextResponse.json(
        { error: "Every session's topic must be one of the class's selected topics." },
        { status: 400 }
      );
    }

    // If enabled, only allow topics the tutor holds a CERTIFIED certification for
    const requireCertification = await getSetting("requireCertificationForClassCreation");
    if (requireCertification) {
      const certifiedTopics = await prisma.topicCertification.findMany({
        where: { tutorProfileId: tutorProfile.id, subject: subject, status: "CERTIFIED" },
        select: { topic: true },
      });
      const certifiedTopicSet = new Set(certifiedTopics.map((c) => c.topic));
      const uncertifiedTopics = topics.filter((t) => !certifiedTopicSet.has(t));

      if (uncertifiedTopics.length > 0) {
        return NextResponse.json(
          { error: `You are not certified for: ${uncertifiedTopics.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    const parsedSessions = sessions.map((s, i) => ({
      topic: sessionTopics[i] as string,
      start: new Date(s.scheduledAt),
      duration: s.duration,
    }));

    // Prevent scheduling any session in the past
    if (parsedSessions.some((s) => s.start.getTime() < Date.now())) {
      return NextResponse.json(
        { error: "Cannot schedule a session in the past." },
        { status: 400 }
      );
    }

    // Sessions submitted together must not overlap each other
    if (hasInternalOverlap(parsedSessions.map((s) => ({ scheduledAt: s.start, duration: s.duration })))) {
      return NextResponse.json(
        { error: "Two or more of the submitted sessions overlap each other." },
        { status: 409 }
      );
    }

    // Each session must not overlap any of the tutor's existing sessions (any class)
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

    const newClass = await prisma.tutorClass.create({
      data: {
        tutorProfileId: tutorProfile.id,
        code,
        subject: subject,
        gradeLevel: gradeLevel ?? null,
        topics: { create: topics.map((topic) => ({ topic })) },
        description: description || null,
        maxStudents,
        building: building || null,
        room: room || null,
        meetingLink: meetingLink || null,
        status: "SCHEDULED",
        sessions: {
          create: parsedSessions.map((s) => ({
            topic: s.topic,
            scheduledAt: s.start,
            duration: s.duration,
          })),
        },
      },
      include: { topics: true, sessions: { orderBy: { scheduledAt: "asc" } } },
    });

    return NextResponse.json(
      { ...newClass, topics: newClass.topics.map((t) => t.topic) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
