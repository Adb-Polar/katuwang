import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveServerSession } from "@/lib/serverSession";
import PageHeader from "@/components/ui/PageHeader";
import TutorBrowser from "@/components/learner/TutorBrowser";
import FindTutorRequests from "@/components/learner/FindTutorRequests";
import TopicRequestManager from "@/components/learner/TopicRequestManager";

export const metadata = {
  title: "Find Tutors | Katuwang",
};

export default async function LearnerTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requestTab = (await searchParams).tab === "requests";
  const session = requestTab ? await getActiveServerSession() : null;
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { gradeLevel: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Find tutors"
        subtitle={requestTab
          ? "Ask for help on a topic when no open class fits, and track your requests here."
          : "Verified Student Tutors, by anonymous ID and the subjects they're certified to teach. Open one to see their topics, schedule, and published classes."}
        actions={
          <Link href="/learner/match" className="btn btn-ghost btn-sm text-xs">
            Auto Match →
          </Link>
        }
      />
      <div role="tablist" aria-label="Find tutors" className="tabs tabs-boxed w-fit">
        <Link href="/learner/tutors" role="tab" aria-selected={!requestTab} className={`tab ${!requestTab ? "tab-active" : ""}`}>
          Find Tutors
        </Link>
        <Link href="/learner/tutors?tab=requests" role="tab" aria-selected={requestTab} className={`tab ${requestTab ? "tab-active" : ""}`}>
          Request Tutor
        </Link>
      </div>
      {requestTab ? (
        <TopicRequestManager defaultGrade={user?.gradeLevel ?? ""} />
      ) : (
        <>
          <TutorBrowser />
          <FindTutorRequests />
        </>
      )}
    </div>
  );
}
