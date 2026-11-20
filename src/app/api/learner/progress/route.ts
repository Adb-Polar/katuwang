import { NextRequest, NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { getLearnerProgress } from "@/lib/progress/learner";

// ─── GET: The Learner's Own Pre/Post-Test Progress — chart (b) ─────────────
// Double-blind: see getLearnerProgress.
export async function GET(req: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session || session.user.role !== "STUDENT_LEARNER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const classId = req.nextUrl.searchParams.get("classId")?.trim() || undefined;
    const { series, summary } = await getLearnerProgress(session.user.id, { classId });

    return NextResponse.json({ series, summary });
  } catch (error) {
    console.error("Error building learner progress:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
