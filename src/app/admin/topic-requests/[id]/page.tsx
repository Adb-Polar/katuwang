import { getActiveServerSession } from "@/lib/serverSession";
import { notFound } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TopicRequestDetail from "@/components/TopicRequestDetail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveServerSession();
  if (!session || !isAdminRole(session.user.role)) notFound();
  const { id } = await params;
  if (!await prisma.topicRequest.findUnique({ where: { id }, select: { id: true } })) notFound();
  return <TopicRequestDetail id={id} back="/admin/topic-requests" />;
}
