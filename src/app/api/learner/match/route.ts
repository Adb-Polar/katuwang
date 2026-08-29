import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reinstateExpiredClasses } from "@/lib/moderation";
import { browsableOrEnrolledWhere, learnerClassInclude, toLearnerClassDTO } from "@/lib/classQueries";
import { getSetting } from "@/lib/settings";
import { matchCriteriaSchema } from "@/lib/validations/match";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { rankMatches, ClassForMatching } from "@/lib/matching";

const MAX_RESULTS = 20;

// ─── POST: Rank browsable classes against a learner's criteria ────────────────
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
    const result = matchCriteriaSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { subject, topics, gradeLevel, preferredSlots } = result.data;

    if (topics.some((t) => !SUBJECT_TOPICS[subject].includes(t))) {
      return NextResponse.json(
        { error: `One or more topics are not valid for ${subject}.` },
        { status: 400 }
      );
    }

    await reinstateExpiredClasses();

    const rows = await prisma.tutorClass.findMany({
      where: { ...browsableOrEnrolledWhere(session.user.id), subject },
      include: learnerClassInclude(session.user.id),
      orderBy: { createdAt: "desc" },
    });

    const dtos = rows.map(toLearnerClassDTO);

    const forMatching: (ClassForMatching & { dto: ReturnType<typeof toLearnerClassDTO> })[] = dtos
      // Don't recommend a class the learner is already enrolled in.
      .filter((c) => c.enrollments.length === 0)
      .map((c) => ({
        id: c.id,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        topics: c.topics,
        verifiedTopics: c.verifiedTopics,
        sessions: c.sessions,
        maxStudents: c.maxStudents,
        enrollmentCount: c._count.enrollments,
        status: c.status,
        published: c.published,
        dto: c,
      }));

    const matches = rankMatches({ subject, topics, gradeLevel, preferredSlots }, forMatching)
      .slice(0, MAX_RESULTS)
      .map((m) => ({ class: m.class.dto, score: m.score, reasons: m.reasons }));

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error matching classes:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
