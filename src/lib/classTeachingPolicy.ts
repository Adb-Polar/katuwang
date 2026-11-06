import type { GradeLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { subjectExists } from "@/lib/subjects";
import { normalizeTopic } from "@/lib/subjectTopics";
import { isTargetGradeEligibleForTutor } from "@/lib/gradeLevels";

/** Validate a complete teaching scope for both creation and partial edits. */
export async function classTeachingError(scope: {
  tutorProfileId: string;
  tutorGradeLevel: GradeLevel | null;
  subject: string;
  gradeLevel: GradeLevel | null;
  topics: string[];
}): Promise<string | null> {
  if (scope.gradeLevel && scope.tutorGradeLevel &&
      !isTargetGradeEligibleForTutor(scope.gradeLevel, scope.tutorGradeLevel)) {
    return "Target grade cannot be higher than your current grade level.";
  }
  if (!(await subjectExists(scope.subject))) return "Invalid subject.";
  if (scope.topics.length === 0) return "Please select at least one topic.";
  if (await getSetting("requireCertificationForClassCreation")) {
    const certifications = await prisma.topicCertification.findMany({
      where: { tutorProfileId: scope.tutorProfileId, subject: scope.subject, status: "CERTIFIED" },
      select: { topic: true },
    });
    const certified = new Set(certifications.map(({ topic }) => normalizeTopic(topic).toLowerCase()));
    const missing = scope.topics.filter((topic) => !certified.has(normalizeTopic(topic).toLowerCase()));
    if (missing.length) return `You are not certified for: ${missing.join(", ")}.`;
  }
  return null;
}
