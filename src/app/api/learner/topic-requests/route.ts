import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { createTopicRequestSchema } from "@/lib/validations/match";
import { SubjectArea } from "@prisma/client";
import { subjectExists, topicExists } from "@/lib/subjects";
import { notify } from "@/lib/notifications";

const MAX_OPEN_REQUESTS = 10;

const requestInclude = {
  topics: { select: { topic: true } },
  slots: { select: { day: true, startTime: true, endTime: true } },
  directedTutor: { select: { user: { select: { anonymousId: true } } } },
  fulfilledClass: {
    select: {
      id: true,
      subject: true,
      sessions: {
        where: { status: "SCHEDULED" as const },
        orderBy: { scheduledAt: "asc" as const },
        take: 1,
        select: { scheduledAt: true },
      },
      tutorProfile: { select: { user: { select: { anonymousId: true } } } },
    },
  },
};

function serialize(r: {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  status: string;
  createdAt: Date;
  topics: { topic: string }[];
  slots: { day: string; startTime: string; endTime: string }[];
  directedTutor: { user: { anonymousId: string } } | null;
  fulfilledClass:
    | {
        id: string;
        subject: string;
        sessions: { scheduledAt: Date }[];
        tutorProfile: { user: { anonymousId: string } };
      }
    | null;
}) {
  return {
    id: r.id,
    subject: r.subject,
    gradeLevel: r.gradeLevel,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt,
    topics: r.topics.map((t) => t.topic),
    slots: r.slots,
    directedTo: r.directedTutor ? { anonymousId: r.directedTutor.user.anonymousId } : null,
    fulfilledClass: r.fulfilledClass
      ? {
          id: r.fulfilledClass.id,
          subject: r.fulfilledClass.subject,
          nextSessionAt: r.fulfilledClass.sessions[0]?.scheduledAt ?? null,
          tutorAnonymousId: r.fulfilledClass.tutorProfile.user.anonymousId,
        }
      : null,
  };
}

// ─── GET: The caller's own topic requests ────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const requests = await prisma.topicRequest.findMany({
      where: { learnerId: session.user.id },
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests.map(serialize));
  } catch (error) {
    console.error("Error fetching topic requests:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── POST: Create a topic request ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await getSetting("matchingEnabled"))) {
      return NextResponse.json({ error: "Matching is currently unavailable." }, { status: 403 });
    }

    const body = await req.json();
    const result = createTopicRequestSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topics, gradeLevel, preferredSlots, note, directedTutorId } = result.data;

    if (!(await subjectExists(subject))) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }
    if ((await Promise.all(topics.map((t) => topicExists(subject, t)))).some((ok) => !ok)) {
      return NextResponse.json(
        { error: `One or more topics are not valid for ${subject}.` },
        { status: 400 }
      );
    }

    let directedTutorProfileId: string | null = null;
    if (directedTutorId) {
      const directedTutor = await prisma.user.findFirst({
        where: { id: directedTutorId, role: "STUDENT_TUTOR" },
        select: { tutorProfile: { select: { id: true } } },
      });
      if (!directedTutor || !directedTutor.tutorProfile) {
        return NextResponse.json({ error: "The selected tutor could not be found." }, { status: 400 });
      }
      directedTutorProfileId = directedTutor.tutorProfile.id;
    }

    const openCount = await prisma.topicRequest.count({
      where: { learnerId: session.user.id, status: "OPEN" },
    });
    if (openCount >= MAX_OPEN_REQUESTS) {
      return NextResponse.json(
        { error: `You already have ${MAX_OPEN_REQUESTS} open requests. Cancel one before adding another.` },
        { status: 409 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.topicRequest.create({
        data: {
          learnerId: session.user.id,
          subject: subject as SubjectArea,
          gradeLevel,
          note: note || null,
          directedTutorProfileId,
          topics: { create: [...new Set(topics)].map((topic) => ({ topic })) },
          slots: {
            create: (preferredSlots ?? []).map((s) => ({
              day: s.day,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          },
        },
        include: requestInclude,
      });

      if (directedTutorProfileId) {
        const directedTutorProfile = await tx.tutorProfile.findUnique({
          where: { id: directedTutorProfileId },
          select: { userId: true },
        });
        if (directedTutorProfile) {
          await notify(
            tx,
            directedTutorProfile.userId,
            "TOPIC_REQUEST_DIRECTED",
            `${session.user.anonymousId} directed a topic request to you (${subject}).`,
            "/tutor/requests"
          );
        }
      }

      return request;
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (error) {
    console.error("Error creating topic request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
