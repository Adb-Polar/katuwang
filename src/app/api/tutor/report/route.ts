import { NextRequest, NextResponse } from "next/server";
import { withQueue } from "@/lib/requestQueue";
import { getActiveServerSession } from "@/lib/serverSession";
import { isAccessError, loadOwnedClass } from "@/lib/sessionTestAccess";
import { parseReportQuery } from "@/lib/reports/query";
import { buildTutorClassReport, buildTutorSummaryReport } from "@/lib/reports/tutor";
import { reportResponse } from "@/lib/reports/respond";
import { TUTOR_REPORT_SCOPES } from "@/lib/validations/reports";

// ─── GET: Tutor class report or tutoring summary (PDF/CSV) ────────────────
// ?scope=summary (default) | class&classId=… — learners by anonymousId only.
async function handleGet(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session || session.user.role !== "STUDENT_TUTOR") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const query = parseReportQuery(req.nextUrl.searchParams);
    if ("error" in query) return NextResponse.json({ error: query.error }, { status: 400 });
    const scope = query.scope ?? "summary";
    if (!(TUTOR_REPORT_SCOPES as readonly string[]).includes(scope)) {
      return NextResponse.json({ error: "Invalid report scope." }, { status: 400 });
    }

    if (scope === "class") {
      if (!query.classId) return NextResponse.json({ error: "Choose a class." }, { status: 400 });
      const owned = await loadOwnedClass(session.user.id, query.classId);
      if (isAccessError(owned)) return NextResponse.json({ error: owned.error }, { status: owned.status });
      const model = await buildTutorClassReport(query.classId, query.range);
      if (!model) return NextResponse.json({ error: "Class not found." }, { status: 404 });
      return await reportResponse(model, query.range, query.format);
    }

    const model = await buildTutorSummaryReport(session.user.id, query.range);
    if (!model) return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    return await reportResponse(model, query.range, query.format);
  } catch (error) {
    console.error("Error generating tutor report:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

export const GET = withQueue("report", handleGet);
