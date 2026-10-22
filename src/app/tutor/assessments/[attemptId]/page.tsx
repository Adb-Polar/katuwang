import { getActiveServerSession } from "@/lib/serverSession";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeAttempt } from "@/lib/assessmentSerialize";
import AssessmentQuizRunner, { QuizAttempt } from "@/components/tutor/AssessmentQuizRunner";

export const metadata = {
  title: "Assessment | Katuwang",
};

export default async function TutorAssessmentAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await getActiveServerSession();
  if (!session) redirect("/login");
  const { attemptId } = await params;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      items: { include: { question: { include: { options: true } } } },
      tutorProfile: { select: { userId: true } },
    },
  });

  if (!attempt || attempt.tutorProfile.userId !== session!.user.id) {
    notFound();
  }

  const serialized = serializeAttempt(attempt, { reveal: attempt.status !== "IN_PROGRESS", revealAnswers: false });

  return <AssessmentQuizRunner attempt={serialized as QuizAttempt} />;
}
