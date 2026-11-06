import { catalogFailureResponse } from "@/lib/catalogError";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { ClassStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lockTutorSchedule, ClassWriteError } from "@/lib/classLocks";
import { createClassSchema } from "@/lib/validations/class";
import { normalizeTopic } from "@/lib/normalizeTopic";
import { classTeachingError } from "@/lib/classTeachingPolicy";
import { profilePictureActionError } from "@/lib/profilePicturePolicy";
import { hasInternalOverlap, hasSessionOverlap } from "@/lib/classSessions";
import { MINUTE_MS } from "@/lib/datetime";
import { generateClassCode } from "@/lib/idGenerator";

// ─── GET: Fetch Tutor's Classes ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

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
    const catalogFailure = catalogFailureResponse(error);
    if (catalogFailure) return catalogFailure;
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
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { image: true, gradeLevel: true } } },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { subject, gradeLevel, description, maxStudents, building, room, meetingLink, sessions, published = true } =
      result.data;

    if (published) {
      const pictureError = await profilePictureActionError("PUBLISH_CLASS", tutorProfile.user?.image);
      if (pictureError) return NextResponse.json({ error: pictureError }, { status: 400 });
    }

    // Normalize + de-duplicate topics. Custom class topics remain supported;
    // subject validity and required certifications use database records.
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

    const teachingError = await classTeachingError({
      tutorProfileId: tutorProfile.id,
      tutorGradeLevel: tutorProfile.user?.gradeLevel ?? session.user.gradeLevel ?? null,
      subject, gradeLevel: gradeLevel ?? null, topics,
    });
    if (teachingError) return NextResponse.json({ error: teachingError }, { status: 400 });

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

    const code = await generateClassCode();

    const newClass = await prisma.$transaction(async (tx) => {
      await lockTutorSchedule(tx, tutorProfile.id);
      for (const s of parsedSessions) {
        if (s.start.getTime() < Date.now()) throw new ClassWriteError("Cannot schedule a session in the past.", 400);
        const end = new Date(s.start.getTime() + s.duration * MINUTE_MS);
        if (await hasSessionOverlap(tutorProfile.id, s.start, end, undefined, tx)) {
          throw new ClassWriteError("Time conflict detected: You already have a session scheduled during this time.", 409);
        }
      }
      return tx.tutorClass.create({
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
          published,
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
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });

    return NextResponse.json(
      { ...newClass, topics: newClass.topics.map((t) => t.topic) },
      { status: 201 }
    );
  } catch (error) {
    const catalogFailure = catalogFailureResponse(error);
    if (catalogFailure) return catalogFailure;
    if (error instanceof ClassWriteError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error creating tutor class:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
