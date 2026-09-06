import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import TopicRequestManager from "@/components/learner/TopicRequestManager";

export const metadata = {
  title: "My Requests | Katuwang",
};

export default async function LearnerRequestsPage() {
  const session = await getServerSession(authOptions);
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { gradeLevel: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Class requests"
        subtitle="Ask for help on a topic when no open class fits."
      />
      <TopicRequestManager defaultGrade={me?.gradeLevel ?? ""} />
    </div>
  );
}
