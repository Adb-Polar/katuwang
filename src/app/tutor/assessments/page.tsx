import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { TaughtTopic } from "@/components/tutor/TopicCertificationList";
import { CertificationDetail } from "@/components/tutor/AssessmentHistory";
import AssessmentsTabs from "@/components/tutor/AssessmentsTabs";
import { getTopicAssessmentStatus, TopicAssessmentStatus } from "@/lib/assessmentStatus";

export const metadata = {
  title: "Assessments | Katuwang",
};

export interface AttemptSummary {
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  passPercent: number;
  startedAt: string;
  submittedAt: string | null;
}

export default async function TutorAssessmentsPage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      tutorProfile: {
        include: {
          topicCertifications: true,
          classes: { include: { topics: true } },
        },
      },
    },
  });

  const tutorProfile = user?.tutorProfile;
  const classes = tutorProfile?.classes ?? [];
  const certifications = tutorProfile?.topicCertifications ?? [];

  const taughtTopics: TaughtTopic[] = Array.from(
    new Map(
      classes.flatMap((c) =>
        c.topics.map((t) => [`${c.subject}::${t.topic}`, { subject: c.subject, topic: t.topic }])
      )
    ).values()
  );

  const classesByTopic = new Map<string, { id: string; subject: string; status: string }[]>();
  for (const c of classes) {
    for (const t of c.topics) {
      const key = `${c.subject}::${t.topic}`;
      const existing = classesByTopic.get(key) ?? [];
      existing.push({ id: c.id, subject: c.subject, status: c.status });
      classesByTopic.set(key, existing);
    }
  }

  const certificationDetails: CertificationDetail[] = certifications.map((c) => ({
    id: c.id,
    subject: c.subject,
    topic: c.topic,
    status: c.status,
    requestedAt: c.requestedAt.toISOString(),
    certifiedAt: c.certifiedAt ? c.certifiedAt.toISOString() : null,
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
    reviewNote: c.reviewNote ?? null,
    usedInClasses: classesByTopic.get(`${c.subject}::${c.topic}`) ?? [],
  }));

  const [statusMap, attemptRows] = tutorProfile
    ? await Promise.all([
        getTopicAssessmentStatus(tutorProfile.id, taughtTopics),
        prisma.assessmentAttempt.findMany({
          where: { tutorProfileId: tutorProfile.id },
          orderBy: { startedAt: "desc" },
        }),
      ])
    : [new Map<string, TopicAssessmentStatus>(), []];

  const topicStatuses: Record<string, TopicAssessmentStatus> = Object.fromEntries(statusMap);

  const attempts: AttemptSummary[] = attemptRows.map((a) => ({
    id: a.id,
    subject: a.subject,
    topic: a.topic,
    attemptNo: a.attemptNo,
    status: a.status,
    questionCount: a.questionCount,
    correctCount: a.correctCount,
    scorePercent: a.scorePercent,
    passPercent: a.passPercent,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tutor Portal"
        title="Your assessments"
        subtitle="Take an auto-graded quiz for any topic you teach. Pass to earn a verified badge learners can see."
      />

      <AssessmentsTabs
        taughtTopics={taughtTopics}
        initialCertifications={certifications.map((c) => ({
          subject: c.subject,
          topic: c.topic,
          status: c.status,
          reviewNote: c.reviewNote ?? null,
        }))}
        certificationDetails={certificationDetails}
        topicStatuses={topicStatuses}
        attempts={attempts}
      />
    </div>
  );
}
