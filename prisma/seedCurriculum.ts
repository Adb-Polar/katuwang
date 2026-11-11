import { prisma } from "../src/lib/prisma";
import { seedSubjectCatalog } from "./seedSubjectCatalog";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { validateCurriculumCatalog } from "../src/lib/validateCurriculumCatalog";

/** Catalog-only entrypoint: no accounts, quizzes, or demo classes. Defaults to a read-only plan. */
export async function seedCurriculumDatabase(apply = false) {
  validateCurriculumCatalog(SUBJECT_CATALOG);
  const existing = await prisma.subject.findMany({ include: { topics: true } });
  const matches = (slug: string, name: string) => SUBJECT_CATALOG.find((s) => s.slug === slug)?.topics.some((t) => t.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  const plan = {
    mode: apply ? "apply" : "dry-run",
    subjects: SUBJECT_CATALOG.length,
    topics: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0),
    gradeAssociations: SUBJECT_CATALOG.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.gradeLevels.length, 0), 0),
    exactTopicMatches: existing.flatMap((s) => s.topics.filter((t) => matches(s.slug, t.name))).length,
    retainedUnmatched: existing.flatMap((s) => s.topics.filter((t) => !matches(s.slug, t.name)).map((t) => ({ subject: s.slug, topic: t.name, id: t.id }))),
    references: {
      classes: await prisma.tutorClass.count(), requests: await prisma.topicRequest.count(),
      certifications: await prisma.topicCertification.count(), questions: await prisma.assessmentQuestion.count(),
      attempts: await prisma.assessmentAttempt.count(), questionRequests: await prisma.questionRequest.count(),
      learners: await prisma.user.count({ where: { role: "STUDENT_LEARNER" } }), tutors: await prisma.tutorProfile.count(),
    },
  };
  console.log(JSON.stringify(plan, null, 2));
  return apply ? seedSubjectCatalog(prisma) : plan;
}
seedCurriculumDatabase(process.argv.includes("--apply")).then((result) => console.log(result))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
