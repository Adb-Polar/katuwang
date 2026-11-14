import type { PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { qualificationQuestionWhere } from "../src/lib/qualificationBank";
import { curriculumDemoRecipe, seedId } from "./curriculumDemoData";
import { loadQuestionBank } from "./questionBankData";
import { seedGrades } from "./seedCatalogHelpers";

/** Verify only the rebuilt seed graph; protected real activity remains historical. */
export async function verifySeedData(prisma: PrismaClient, minimumQuestions = 20) {
  const recipe = curriculumDemoRecipe();
  const classIds = [...recipe.map(r => r.classId), ...Array.from({ length: 6 }, (_, i) => seedId("history-class", String(i)))];
  const [subjects, classes, requests, bank] = await Promise.all([
    prisma.subject.findMany({ where: { active: true }, include: { topics: { where: { active: true } } } }),
    prisma.tutorClass.findMany({ where: { id: { in: classIds } }, include: { topics: true, enrollments: { include: { learner: { select: { gradeLevel: true } } } }, sessions: { include: { test: { include: { questions: { include: { question: { select: { subject: true, topic: true } } } } } } } } } }),
    prisma.topicRequest.findMany({ where: { id: { in: recipe.map(r => r.requestId) } }, include: { topics: true, learner: { select: { gradeLevel: true } }, history: true } }),
    prisma.assessmentQuestion.findMany({ where: { origin: "BANK", active: true }, include: { options: true } }),
  ]);
  const expectedTopics = SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0);
  if (subjects.length !== SUBJECT_CATALOG.length || subjects.reduce((n, s) => n + s.topics.length, 0) !== expectedTopics) throw Error("Seed catalog counts differ from the canonical catalog.");
  for (const expected of SUBJECT_CATALOG) {
    const actual = subjects.find(s => s.slug === expected.slug);
    if (!actual || actual.topics.length !== expected.topics.length || expected.topics.some(t => !actual.topics.some(a => a.name === t.name && JSON.stringify(a.gradeLevels) === JSON.stringify(t.gradeLevels)))) throw Error("Seed catalog has missing topics or incorrect grade coverage.");
  }
  if (classes.length !== classIds.length || requests.length !== recipe.length) throw Error("The connected seed graph is incomplete.");
  const classesById = new Map(classes.map(c => [c.id, c]));
  for (const r of recipe) {
    const c = classesById.get(r.classId);
    if (!c || c.subject !== r.subject || c.gradeLevel !== r.gradeLevel || c.status !== "SCHEDULED" || !c.published || !c.topics.some(t => t.topic === r.topic)) throw Error("Missing published class for a curriculum grade association.");
  }
  for (const c of classes) {
    const grades = seedGrades(c.subject, [...new Set([...c.topics.map(t => t.topic), ...c.sessions.map(s => s.topic)])]);
    if (!c.gradeLevel || !grades.includes(c.gradeLevel) || c.enrollments.some(e => e.learner.gradeLevel !== c.gradeLevel)) throw Error("Seed class or enrollment has incompatible grades.");
    for (const s of c.sessions) {
      if (!s.test || s.test.questions.length !== 5 || s.test.questions.some(q => q.question.subject !== c.subject || q.question.topic !== s.topic)) throw Error("Session test uses the wrong topic or an incomplete bank.");
    }
  }
  for (const r of requests) if (r.learner.gradeLevel !== r.gradeLevel || !seedGrades(r.subject, r.topics.map(t => t.topic)).includes(r.gradeLevel) || !r.history.length) throw Error("Seed request has incompatible grades or no history.");
  const sourceIds = new Set(loadQuestionBank().questions.map(q => q.id));
  const counts = new Map<string, number>();
  for (const q of bank) {
    if (!sourceIds.has(q.id) || q.options.length !== 4 || q.options.filter(o => o.isCorrect).length !== 1) throw Error("The active bank contains noncanonical or malformed questions.");
    const key = JSON.stringify([q.subject, q.topic]); counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const s of SUBJECT_CATALOG) for (const t of s.topics) if ((counts.get(JSON.stringify([s.slug, t.name])) ?? 0) < minimumQuestions) throw Error(`Missing bank questions for ${s.slug} / ${t.name}`);
  const approvedQuestions = await prisma.assessmentQuestion.count({ where: qualificationQuestionWhere({ id: { in: [...sourceIds] } }) });
  return { subjects: subjects.length, topics: expectedTopics, gradeAssociations: recipe.length, classes: classes.length, requests: requests.length, sessionTests: classes.flatMap(c => c.sessions).length,
    activeBankQuestions: bank.length, approvedQuestions, minQuestionsPerTopic: Math.min(...counts.values()), invalidRecords: 0 };
}
