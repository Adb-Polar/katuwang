import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import PageHeader from "@/components/ui/PageHeader";
import AcceptRequestForm from "@/components/tutor/AcceptRequestForm";

export const metadata = {
  title: "Accept Topic Request | Katuwang",
};

export default async function AcceptTopicRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!(await getSetting("matchingEnabled"))) notFound();

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session!.user.id },
    select: {
      id: true,
      topicCertifications: {
        where: { status: "CERTIFIED" },
        select: { subject: true, topic: true },
      },
    },
  });
  if (!tutorProfile) notFound();

  const certifiedTopics = tutorProfile.topicCertifications;

  // Only requests this tutor is actually eligible to accept (directed to them, or
  // public in one of their certified subjects/topics) — same gate as the list.
  const request = await prisma.topicRequest.findFirst({
    where: { AND: [{ id }, tutorPoolWhere(tutorProfile.id, certifiedTopics)] },
    include: {
      topics: { select: { topic: true } },
      slots: { select: { day: true, startTime: true, endTime: true } },
    },
  });
  if (!request) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Accept & create class"
        subtitle="Auto-create a class from this topic request. Certification required per topic."
      />
      <AcceptRequestForm
        request={{
          id: request.id,
          subject: request.subject,
          gradeLevel: request.gradeLevel,
          note: request.note,
          topics: request.topics.map((t) => t.topic),
          slots: request.slots,
        }}
        certifiedTopics={certifiedTopics
          .filter((c) => c.subject === request.subject)
          .map((c) => c.topic)}
      />
    </div>
  );
}
