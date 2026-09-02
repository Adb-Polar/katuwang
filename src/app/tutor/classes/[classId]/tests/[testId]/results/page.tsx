import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";
import ClassTestResults from "@/components/tutor/ClassTestResults";

export const metadata = {
  title: "Test Results | Katuwang",
};

export default async function TutorClassTestResultsPage({
  params,
}: {
  params: Promise<{ classId: string; testId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { classId, testId } = await params;

  const owned = await loadOwnedTest(session!.user.id, classId, testId);
  if (isAccessError(owned)) notFound();

  return (
    <ClassTestResults
      resultsUrl={`/api/tutor/classes/${classId}/tests/${testId}/results`}
      attemptUrl={(attemptId) =>
        `/api/tutor/classes/${classId}/tests/${testId}/attempts/${attemptId}`
      }
      backHref={`/tutor/classes/${classId}/tests/${testId}`}
    />
  );
}
