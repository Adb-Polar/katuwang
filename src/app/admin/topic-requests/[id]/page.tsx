import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TopicRequestDetail from "@/components/TopicRequestDetail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) notFound();
  const { id } = await params;
  if (!await prisma.topicRequest.findUnique({ where: { id }, select: { id: true } })) notFound();
  return <TopicRequestDetail id={id} back="/admin/topic-requests" />;
}
