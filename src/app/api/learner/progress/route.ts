import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function avg(nums: number[]): number | null {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

// ─── GET: The Learner's Own Pre/Post-Test Progress — chart (b) ─────────────
// Double-blind: no tutor identity, no cohort/class-average stats (a 1-on-1 or
// small class would make "class average" a de-anonymisation oracle).
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const classId = req.nextUrl.searchParams.get("classId")?.trim() || undefined;

    const enrollments = await prisma.classEnrollment.findMany({
      where: { learnerId: session.user.id, ...(classId ? { classId } : {}) },
      select: {
        class: {
          select: {
            code: true,
            subject: true,
            sessions: {
              select: {
                id: true,
                topic: true,
                scheduledAt: true,
                status: true,
                test: {
                  select: {
                    status: true,
                    attempts: {
                      where: { learnerId: session.user.id },
                      select: { kind: true, scorePercent: true, status: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const series = enrollments
      .flatMap((e) =>
        e.class.sessions
          .filter((s) => s.test && s.test.status !== "DRAFT")
          .map((s) => {
            const submitted = s.test!.attempts.filter((a) => a.status === "SUBMITTED");
            const pre = submitted.find((a) => a.kind === "PRE")?.scorePercent ?? null;
            const post = submitted.find((a) => a.kind === "POST")?.scorePercent ?? null;
            const delta = pre != null && post != null ? post - pre : null;
            return {
              classCode: e.class.code,
              subject: e.class.subject,
              topic: s.topic,
              scheduledAt: s.scheduledAt.toISOString(),
              preScore: pre,
              postScore: post,
              delta,
            };
          }),
      )
      // Sort in JS — reads through session -> test -> attempts, not a Prisma orderBy path.
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const deltas = series.filter((r) => r.delta != null).map((r) => r.delta!);

    return NextResponse.json({
      series,
      summary: {
        sessionsWithTest: series.length,
        pairedCount: deltas.length,
        avgDelta: avg(deltas),
      },
    });
  } catch (error) {
    console.error("Error building learner progress:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
