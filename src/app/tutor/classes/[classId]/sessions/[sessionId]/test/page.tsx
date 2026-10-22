import { getActiveServerSession } from "@/lib/serverSession";
import { notFound, redirect } from "next/navigation";
import { isAccessError, loadOwnedSession } from "@/lib/sessionTestAccess";
import { serializeSessionTest } from "@/lib/sessionTestSerialize";
import SessionTestBuilder from "@/components/tutor/SessionTestBuilder";

export const metadata = {
  title: "Build Session Test | Katuwang",
};

export default async function TutorSessionTestBuilderPage({
  params,
}: {
  params: Promise<{ classId: string; sessionId: string }>;
}) {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const { classId, sessionId } = await params;

  const owned = await loadOwnedSession(session!.user.id, classId, sessionId);
  if (isAccessError(owned)) notFound();

  const serialized = owned.test ? serializeSessionTest(owned.test) : null;

  return (
    <SessionTestBuilder
      classId={classId}
      sessionId={sessionId}
      classSubject={owned.tutorClass.subject}
      classTopics={owned.tutorClass.topics.map((t) => t.topic)}
      sessionTopic={owned.session.topic}
      test={
        serialized
          ? {
              id: serialized.id,
              title: serialized.title,
              instructions: serialized.instructions,
              status: serialized.status as "DRAFT" | "PUBLISHED" | "CLOSED",
              questions: serialized.questions.map((q) => ({
                questionId: q.questionId,
                prompt: q.prompt,
                origin: q.origin,
                topic: q.topic,
              })),
            }
          : null
      }
      attemptCount={owned.test?._count.attempts ?? 0}
    />
  );
}
