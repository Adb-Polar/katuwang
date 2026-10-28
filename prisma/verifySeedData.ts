import type { PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { seedGrades } from "./seedCatalogHelpers";

export async function verifySeedData(prisma: PrismaClient, minimumQuestions = 5) {
  const [subjects, topics, classes, requests, certs, questions, attempts, questionRequests, tutors, learners] = await Promise.all([
    prisma.subject.findMany({ where: { active: true } }), prisma.topic.count({ where: { active: true } }),
    prisma.tutorClass.findMany({ include: { topics: true, sessions: true } }),
    prisma.topicRequest.findMany({ include: { topics: true } }), prisma.topicCertification.findMany(),
    prisma.assessmentQuestion.findMany({ select: { subject: true, topic: true } }),
    prisma.assessmentAttempt.findMany({ select: { subject: true, topic: true } }),
    prisma.questionRequest.findMany({ select: { subject: true, topic: true } }),
    prisma.tutorProfile.count(), prisma.user.count({ where: { role: "STUDENT_LEARNER" } }),
  ]);
  if (subjects.length !== 10 || topics !== 135) throw new Error("Seed catalog must have 10 active subjects and 135 active topics.");
  const expected = new Set(SUBJECT_CATALOG.map((s) => s.slug));
  if (subjects.some((s) => !expected.has(s.slug))) throw new Error("Legacy subject remains in the active seed catalog.");
  for (const row of classes) {
    const names = [...new Set([...row.topics.map((t) => t.topic), ...row.sessions.map((s) => s.topic)])];
    const grades = seedGrades(row.subject, names);
    if (row.gradeLevel && !grades.includes(row.gradeLevel)) throw new Error(`Seed class has incompatible grade: ${row.code}`);
  }
  for (const row of requests) {
    if (!seedGrades(row.subject, row.topics.map((t) => t.topic)).includes(row.gradeLevel)) throw new Error("Seed request has incompatible grade.");
  }
  for (const row of [...certs, ...questions, ...attempts, ...questionRequests]) seedGrades(row.subject, [row.topic]);
  const covered = new Set(classes.filter((c) => c.published && c.status === "SCHEDULED").map((c) => c.subject));
  if (SUBJECT_CATALOG.some((s) => !covered.has(s.slug))) throw new Error("Each group needs a published scheduled demo class.");
  const bank = new Map<string, number>();
  for (const q of questions) { const key = `${q.subject}::${q.topic}`; bank.set(key, (bank.get(key) ?? 0) + 1); }
  for (const s of SUBJECT_CATALOG) for (const t of s.topics) {
    if ((bank.get(`${s.slug}::${t.name}`) ?? 0) < minimumQuestions) throw new Error(`Missing seed questions for ${s.slug} / ${t.name}`);
  }
  const summary = { subjects: subjects.length, topics, classes: classes.length, tutors, learners, questions: questions.length, requests: requests.length, invalidRecords: 0 };
  console.log(`Grouped seed verification passed: ${JSON.stringify(summary)}`);
  return summary;
}
