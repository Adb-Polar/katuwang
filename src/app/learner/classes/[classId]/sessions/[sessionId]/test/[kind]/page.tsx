import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccessError, loadEnrolledSession } from "@/lib/sessionTestAccess";
import SessionTestRunner from "@/components/quiz/SessionTestRunner";

export const metadata = {
  title: "Session Test | Katuwang",
};

export default async function LearnerSessionTestPage({
  params,
}: {
  params: Promise<{ classId: string; sessionId: string; kind: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { classId, sessionId, kind: kindParam } = await params;
  const kind = kindParam.toUpperCase();

  if (kind !== "PRE" && kind !== "POST") notFound();

  const access = await loadEnrolledSession(session!.user.id, classId, sessionId);
  if (isAccessError(access)) notFound();

  const test = await prisma.sessionTest.findUnique({
    where: { sessionId },
    select: { id: true, status: true },
  });
  if (!test || test.status === "DRAFT") notFound();

  const existing = await prisma.sessionTestAttempt.findUnique({
    where: { sessionTestId_learnerId_kind: { sessionTestId: test.id, learnerId: session!.user.id, kind } },
    select: { id: true },
  });

  return (
    <SessionTestRunner classId={classId} sessionId={sessionId} kind={kind} attemptId={existing?.id ?? null} />
  );
}
