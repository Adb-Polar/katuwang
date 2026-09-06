import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);
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
