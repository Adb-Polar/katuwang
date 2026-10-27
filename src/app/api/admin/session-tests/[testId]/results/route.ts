import { isAdminRole } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { buildSessionTestResults } from "@/lib/sessionTestResults";

// ─── GET: Session Test Results (admin, read-only) ──────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> },
) {
  try {
    const session = await getActiveServerSession();
    const { testId } = await params;

    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const results = await buildSessionTestResults(testId);
    if (!results) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error building session test results (admin):", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
