import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import TutorBrowser from "@/components/learner/TutorBrowser";
import FindTutorRequests from "@/components/learner/FindTutorRequests";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Find Tutors | Katuwang",
};

export default async function LearnerTutorsPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gradeLevel: true } });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Find tutors"
        subtitle="Verified Student Tutors, by anonymous ID and the subjects they're certified to teach. Open one to see their topics, schedule, and published classes."
        actions={
          <Link href="/learner/match" className="btn btn-ghost btn-sm text-xs">
            Auto Match →
          </Link>
        }
      />
      <TutorBrowser />
      <FindTutorRequests defaultGrade={user?.gradeLevel ?? ""} />
    </div>
  );
}
