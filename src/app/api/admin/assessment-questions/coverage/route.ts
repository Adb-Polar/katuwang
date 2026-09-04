import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { getAssessmentConfig } from "@/lib/settings";

const keyOf = (subject: string, topic: string) => `${subject}::${topic}`;

// ─── GET: Per-topic Bank Coverage ───────────────────────────────────────────
// One row per curated (subject, topic): active question count, effective config,
// readiness flag, and how many question requests are open for it.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const [counts, config, openRequests] = await Promise.all([
      prisma.assessmentQuestion.groupBy({
        by: ["subject", "topic"],
        where: { active: true },
        _count: { _all: true },
      }),
      getAssessmentConfig(),
      prisma.questionRequest.groupBy({
        by: ["subject", "topic"],
        where: { status: "OPEN" },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map(counts.map((c) => [keyOf(c.subject, c.topic), c._count._all]));
    const requestMap = new Map(openRequests.map((r) => [keyOf(r.subject, r.topic), r._count._all]));

    const coverage = (Object.keys(SUBJECT_TOPICS) as string[]).flatMap((subject) =>
      SUBJECT_TOPICS[subject].map((topic) => {
        const k = keyOf(subject, topic);
        const activeCount = countMap.get(k) ?? 0;
        return {
          subject,
          topic,
          activeCount,
          config,
          ready: activeCount >= config.minBankSize,
          openRequests: requestMap.get(k) ?? 0,
        };
      })
    );

    return NextResponse.json(coverage);
  } catch (error) {
    console.error("Error computing question bank coverage:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
