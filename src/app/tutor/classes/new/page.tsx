import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import PageHeader from "@/components/ui/PageHeader";
import NewClassForm from "@/components/tutor/NewClassForm";

export const metadata = {
  title: "Schedule a Class | Katuwang",
};

export default async function NewClassPage() {
  const session = await getServerSession(authOptions);
  const requireCertification = await getSetting("requireCertificationForClassCreation");

  let allowedTopics: string[] | undefined;
  if (requireCertification) {
    const certs = await prisma.topicCertification.findMany({
      where: { tutorProfile: { userId: session!.user.id }, status: "CERTIFIED" },
      select: { topic: true },
    });
    allowedTopics = certs.map((c) => c.topic);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Schedule a tutoring class"
        subtitle="Pick a subject and topics, add your sessions, and publish it for tutees to discover and enroll."
      />
      <NewClassForm allowedTopics={allowedTopics} />
    </div>
  );
}
