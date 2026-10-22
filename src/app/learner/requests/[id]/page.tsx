import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopicRequestDetail from "@/components/TopicRequestDetail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session || session.user.role !== "STUDENT_LEARNER" || !await prisma.topicRequest.findFirst({ where: { id, learnerId: session.user.id }, select: { id: true } })) notFound();
  return <TopicRequestDetail id={id} back="/learner/requests" />;
}
