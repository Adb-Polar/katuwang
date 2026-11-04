import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import TopicRequestManager from "@/components/learner/TopicRequestManager";

export const metadata = {
  title: "My Requests | Katuwang",
};

export default async function LearnerRequestsPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gradeLevel: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="My requests"
        subtitle="Ask for help on a topic when no open class fits, and track your requests here."
      />
      <TopicRequestManager defaultGrade={user?.gradeLevel ?? ""} />
    </div>
  );
}
