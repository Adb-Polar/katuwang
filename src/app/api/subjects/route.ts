import { NextResponse } from "next/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { getSubjects } from "@/lib/subjects";

// ─── GET: active subjects + topics, for populating dropdowns ───────────────
// Any authenticated role. Cached via src/lib/subjects.ts.
export async function GET() {
  try {
    const session = await getActiveServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subjects = await getSubjects();
    return NextResponse.json({
      subjects: subjects.map((s) => ({
        slug: s.slug,
        name: s.name,
        gradeLevels: s.gradeLevels,
        topicGrades: Object.fromEntries(s.topics.map((t) => [t.name, t.gradeLevels])),
        curriculum: s.curriculum,
        topicDetails: s.topics.map((t) => ({ name: t.name, gradeLevels: t.gradeLevels, curriculum: t.curriculum })),
        topics: s.topics.map((t) => t.name),
      })),
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
