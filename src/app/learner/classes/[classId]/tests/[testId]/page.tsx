import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeClassTestAttempt } from "@/lib/classTestSerialize";
import ClassTestRunner, { ClassTestRunnerAttempt } from "@/components/quiz/ClassTestRunner";

export const metadata = {
  title: "Class Test | Katuwang",
};

const ATTEMPT_INCLUDE = {
  items: { include: { question: { include: { options: true } } } },
  classTest: { select: { id: true, kind: true, title: true, instructions: true } },
} as const;

export default async function LearnerClassTestPage({
  params,
}: {
  params: Promise<{ classId: string; testId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { classId, testId } = await params;
  const learnerId = session!.user.id;

  const [enrollment, test] = await Promise.all([
    prisma.classEnrollment.findUnique({
      where: { classId_learnerId: { classId, learnerId } },
      select: { id: true },
    }),
    prisma.classTest.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { position: "asc" }, select: { questionId: true, position: true } } },
    }),
  ]);

  if (!enrollment || !test || test.classId !== classId) notFound();

  let attempt = await prisma.classTestAttempt.findUnique({
    where: { classTestId_learnerId: { classTestId: testId, learnerId } },
    include: ATTEMPT_INCLUDE,
  });

  if (!attempt) {
    if (test.status !== "PUBLISHED") notFound();
    attempt = await prisma.classTestAttempt.create({
      data: {
        classTestId: testId,
        learnerId,
        totalQuestions: test.questions.length,
        items: {
          create: test.questions.map((q) => ({ questionId: q.questionId, position: q.position })),
        },
      },
      include: ATTEMPT_INCLUDE,
    });
  }

  const serialized = serializeClassTestAttempt(attempt, {
    reveal: attempt.status === "SUBMITTED",
  });

  return (
    <ClassTestRunner attempt={serialized as ClassTestRunnerAttempt} classId={classId} />
  );
}
