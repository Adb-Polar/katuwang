import { redirect } from "next/navigation";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import PageHeader from "@/components/ui/PageHeader";
import BackLink from "@/components/ui/BackLink";
import NewClassForm from "@/components/tutor/NewClassForm";

export const metadata = {
  title: "Schedule a Class | Katuwang",
};

export default async function NewClassPage() {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const requireCertification = await getSetting("requireCertificationForClassCreation");

  let allowedTopics: string[] | undefined;
  if (requireCertification) {
    const certs = await prisma.topicCertification.findMany({
      where: { tutorProfile: { userId: session!.user.id }, status: "CERTIFIED" },
      select: { topic: true },
    });
    allowedTopics = certs.map((c) => c.topic);
  }

  const tutorUser = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { gradeLevel: true },
  });
  const tutorGradeLevel = tutorUser?.gradeLevel ?? session?.user?.gradeLevel ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <BackLink href="/tutor/classes">Back to your classes</BackLink>
        <PageHeader
          eyebrow="Tutor Portal"
          title="Schedule a class"
          subtitle="Pick a grade, subject and topics, then add the sessions. Learners can find the class as soon as you schedule it."
        />
      </div>
      <NewClassForm allowedTopics={allowedTopics} tutorGradeLevel={tutorGradeLevel} />
    </div>
  );
}
