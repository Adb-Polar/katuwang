import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import SessionTestResults from "@/components/tutor/SessionTestResults";

export const metadata = {
  title: "Session Test Results | Katuwang",
};

export default async function TutorSessionTestResultsPage({
  params,
}: {
  params: Promise<{ classId: string; sessionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { classId, sessionId } = await params;

  const owned = await loadOwnedSession(session!.user.id, classId, sessionId);
  if (isAccessError(owned) || !owned.test) notFound();

  return (
    <SessionTestResults
      resultsUrl={`/api/tutor/classes/${classId}/sessions/${sessionId}/test/results`}
      attemptBaseUrl={`/api/tutor/classes/${classId}/sessions/${sessionId}/test/attempts`}
      backHref={`/tutor/classes/${classId}/sessions/${sessionId}/test`}
    />
  );
}
