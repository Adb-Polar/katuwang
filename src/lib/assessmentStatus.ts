import { SubjectArea, TopicCertificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveTopicConfig } from "@/lib/assessmentConfig";

export interface TopicAssessmentStatus {
  bankReady: boolean;
  activeQuestionCount: number;
  minBankSize: number;
  inProgressAttemptId: string | null;
  lastAttempt: { id: string; status: "PASSED" | "FAILED"; scorePercent: number } | null;
  submittedAttemptCount: number;
  openRequest: boolean;
  certificationStatus: TopicCertificationStatus | null;
}

const keyOf = (subject: string, topic: string) => `${subject}::${topic}`;

/**
 * One-pass lookup of everything the tutor Assessments page needs to render a
 * per-topic action button: bank readiness, an in-progress attempt, the latest
 * submitted attempt, whether a question request is open, and the current
 * certification status. Keyed by `"SUBJECT::topic"`.
 */
export async function getTopicAssessmentStatus(
  tutorProfileId: string,
  taughtTopics: { subject: SubjectArea; topic: string }[]
): Promise<Map<string, TopicAssessmentStatus>> {
  const result = new Map<string, TopicAssessmentStatus>();
  if (taughtTopics.length === 0) return result;

  const subjects = [...new Set(taughtTopics.map((t) => t.subject))];
  const topics = [...new Set(taughtTopics.map((t) => t.topic))];

  const [counts, configs, attempts, requests, certs] = await Promise.all([
    prisma.assessmentQuestion.groupBy({
      by: ["subject", "topic"],
      where: { active: true, subject: { in: subjects }, topic: { in: topics } },
      _count: { _all: true },
    }),
    prisma.topicAssessmentConfig.findMany({
      where: { subject: { in: subjects }, topic: { in: topics } },
    }),
    prisma.assessmentAttempt.findMany({
      where: { tutorProfileId, subject: { in: subjects }, topic: { in: topics } },
      orderBy: { attemptNo: "desc" },
      select: { id: true, subject: true, topic: true, status: true, scorePercent: true },
    }),
    prisma.questionRequest.findMany({
      where: { tutorProfileId, status: "OPEN", subject: { in: subjects }, topic: { in: topics } },
      select: { subject: true, topic: true },
    }),
    prisma.topicCertification.findMany({
      where: { tutorProfileId, subject: { in: subjects }, topic: { in: topics } },
      select: { subject: true, topic: true, status: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [keyOf(c.subject, c.topic), c._count._all]));
  const configMap = new Map(configs.map((c) => [keyOf(c.subject, c.topic), c]));
  const requestSet = new Set(requests.map((r) => keyOf(r.subject, r.topic)));
  const certMap = new Map(certs.map((c) => [keyOf(c.subject, c.topic), c.status]));

  const attemptsByKey = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const k = keyOf(a.subject, a.topic);
    (attemptsByKey.get(k) ?? attemptsByKey.set(k, []).get(k)!).push(a);
  }

  for (const { subject, topic } of taughtTopics) {
    const k = keyOf(subject, topic);
    const activeQuestionCount = countMap.get(k) ?? 0;
    const cfg = resolveTopicConfig(configMap.get(k) ?? null);
    const topicAttempts = attemptsByKey.get(k) ?? [];
    const inProgress = topicAttempts.find((a) => a.status === "IN_PROGRESS");
    const submitted = topicAttempts.filter((a) => a.status !== "IN_PROGRESS");
    const last = submitted[0] ?? null; // sorted desc by attemptNo

    result.set(k, {
      bankReady: activeQuestionCount >= cfg.minBankSize,
      activeQuestionCount,
      minBankSize: cfg.minBankSize,
      inProgressAttemptId: inProgress?.id ?? null,
      lastAttempt: last
        ? { id: last.id, status: last.status as "PASSED" | "FAILED", scorePercent: last.scorePercent }
        : null,
      submittedAttemptCount: submitted.length,
      openRequest: requestSet.has(k),
      certificationStatus: certMap.get(k) ?? null,
    });
  }

  return result;
}
