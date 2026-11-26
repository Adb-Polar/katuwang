import { NextRequest, NextResponse } from "next/server";
import { withQueue } from "@/lib/requestQueue";
import { isAdminRole, isSuperAdminRole } from "@/lib/permissions";
import { getActiveServerSession } from "@/lib/serverSession";
import { parseReportQuery } from "@/lib/reports/query";
import { buildAdminReport, type AdminReportScope } from "@/lib/reports/admin";
import { reportResponse } from "@/lib/reports/respond";
import { ADMIN_REPORT_SCOPES } from "@/lib/validations/reports";

// ─── GET: Admin platform report / data exports (PDF/CSV) ──────────────────
async function handleGet(req: NextRequest) {
  try {
    const session = await getActiveServerSession();
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const query = parseReportQuery(req.nextUrl.searchParams);
    if ("error" in query) return NextResponse.json({ error: query.error }, { status: 400 });
    const scope = query.scope ?? "overview";
    if (!(ADMIN_REPORT_SCOPES as readonly string[]).includes(scope)) {
      return NextResponse.json({ error: "Invalid report scope." }, { status: 400 });
    }

    // The audit log is super-admin only, on screen and as an export.
    if (scope === "audit-log" && !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Super Admin access required." }, { status: 403 });
    }

    const model = await buildAdminReport(scope as AdminReportScope, query.range);
    return await reportResponse(model, query.range, query.format);
  } catch (error) {
    console.error("Error generating admin report:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

export const GET = withQueue("report", handleGet);
