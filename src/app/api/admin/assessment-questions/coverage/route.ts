import { qualificationQuestionWhere } from "@/lib/qualificationBank";
import { catalogFailureResponse } from "@/lib/catalogError";
import { isAdminRole } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";

import { prisma } from "@/lib/prisma";
import { getSubjects } from "@/lib/subjects";
import { getAssessmentConfig } from "@/lib/settings";

const keyOf = (subject: string, topic: string) => `${subject}::${topic}`;

// ─── GET: Per-topic Bank Coverage ───────────────────────────────────────────
// One row per curated (subject, topic): active question count, effective config,
// readiness flag, and how many question requests are open for it.
export async function GET() {
  try {
    const session = await getActiveServerSession();

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const [counts, config, openRequests, catalog] = await Promise.all([
      prisma.assessmentQuestion.groupBy({
        by: ["subject", "topic"],
        where: qualificationQuestionWhere(),
        _count: { _all: true },
      }),
      getAssessmentConfig(),
      prisma.questionRequest.groupBy({
        by: ["subject", "topic"],
        where: { status: "OPEN" },
        _count: { _all: true },
      }),
      getSubjects(),
    ]);

    const countMap = new Map(counts.map((c) => [keyOf(c.subject, c.topic), c._count._all]));
    const requestMap = new Map(openRequests.map((r) => [keyOf(r.subject, r.topic), r._count._all]));

    const coverage = catalog.flatMap((entry) =>
      entry.topics.map(({ name: topic }) => {
        const subject = entry.slug;
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
    const catalogFailure = catalogFailureResponse(error);
    if (catalogFailure) return catalogFailure;
    console.error("Error computing question bank coverage:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
