import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tutorPoolWhere } from "@/lib/topicRequestVisibility";
import TopicRequestDetail from "@/components/TopicRequestDetail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT_TUTOR") notFound();
  const { id } = await params;
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!profile) notFound();
  const certified = await prisma.topicCertification.findMany({ where: { tutorProfileId: profile.id, status: "CERTIFIED" }, select: { subject: true, topic: true } });
  const eligible = await prisma.topicRequest.findFirst({ where: { id, OR: [tutorPoolWhere(profile.id, certified, session.user.gradeLevel), { fulfilledClass: { tutorProfileId: profile.id } }, { history: { some: { actorId: session.user.id, eventType: "STATUS_CHANGED" } } }] }, select: { id: true } });
  if (!eligible) notFound();
  return <TopicRequestDetail id={id} back="/tutor/requests" />;
}
