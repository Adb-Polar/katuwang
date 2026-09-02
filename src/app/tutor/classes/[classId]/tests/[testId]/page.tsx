import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAccessError, loadOwnedTest } from "@/lib/classTestAccess";
import { serializeClassTest } from "@/lib/classTestSerialize";
import ClassTestBuilder from "@/components/tutor/ClassTestBuilder";

export const metadata = {
  title: "Build Test | Katuwang",
};

export default async function TutorClassTestBuilderPage({
  params,
}: {
  params: Promise<{ classId: string; testId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { classId, testId } = await params;

  const owned = await loadOwnedTest(session!.user.id, classId, testId);
  if (isAccessError(owned)) notFound();

  const serialized = serializeClassTest(owned.test);

  return (
    <ClassTestBuilder
      classId={classId}
      classSubject={owned.tutorClass.subject}
      classTopics={owned.tutorClass.topics.map((t) => t.topic)}
      test={{
        id: serialized.id,
        kind: serialized.kind,
        title: serialized.title,
        instructions: serialized.instructions,
        status: serialized.status as "DRAFT" | "PUBLISHED" | "CLOSED",
        questions: serialized.questions.map((q) => ({
          questionId: q.questionId,
          prompt: q.prompt,
          origin: q.origin,
          topic: q.topic,
        })),
      }}
    />
  );
}
