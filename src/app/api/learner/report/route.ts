import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { parseReportQuery } from "@/lib/reports/query";
import { buildLearnerReport } from "@/lib/reports/learner";
import { reportResponse } from "@/lib/reports/respond";

// ─── GET: The learner's own progress report (PDF/CSV) ─────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const query = parseReportQuery(req.nextUrl.searchParams);
    if ("error" in query) return NextResponse.json({ error: query.error }, { status: 400 });

    const model = await buildLearnerReport(session.user.id, query.range, query.classId);
    if (!model) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    return await reportResponse(model, query.range, query.format);
  } catch (error) {
    console.error("Error generating learner report:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
