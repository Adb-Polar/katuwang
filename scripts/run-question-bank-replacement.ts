import { prisma } from "../src/lib/prisma";
import { loadQuestionBank } from "../prisma/questionBankData";
import { seedQuestionBankDatabase } from "../prisma/seedQuestionBank";

async function main() {
  const operationId = process.argv[2];
  if (!operationId || !/^[a-zA-Z0-9_-]{1,80}$/.test(operationId)) throw Error("Supply a unique replacement operation ID");
  const target = new URL(process.env.DATABASE_URL ?? "");
  console.log("KATUWANG_QUESTION_REPLACEMENT_TARGET", JSON.stringify({ host: target.hostname, port: target.port || "3306", database: target.pathname.slice(1), operationId }));
  const options = { db: prisma, replace: true, syncCatalog: true, operationId };
  const plan = await seedQuestionBankDatabase({ ...options, dryRun: true });
  console.log("KATUWANG_QUESTION_REPLACEMENT_PLAN", JSON.stringify(plan));
  const result = await seedQuestionBankDatabase(options);
  console.log("KATUWANG_QUESTION_REPLACEMENT_RESULT", JSON.stringify(result));
  const bank = loadQuestionBank();
  const canonicalIds = new Set(bank.questions.map(q => q.id));
  const rows = await prisma.assessmentQuestion.findMany({ where: { origin: "BANK", active: true }, select: { id: true, subject: true, topic: true, reviewStatus: true, options: { select: { isCorrect: true } } } });
  const topicCounts = new Map<string, number>();
  for (const q of rows) { const key = JSON.stringify([q.subject, q.topic]); topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1); }
  const summary = {
    operationId, revision: bank.revision, activeSharedQuestions: rows.length,
    activeQuestionsFromDatasetIds: rows.filter(q => canonicalIds.has(q.id)).length,
    activeSubjectTopicPairs: topicCounts.size,
    minActiveQuestionsPerTopic: rows.length ? Math.min(...topicCounts.values()) : 0,
    maxActiveQuestionsPerTopic: rows.length ? Math.max(...topicCounts.values()) : 0,
    questionsWithFourOptions: rows.filter(q => q.options.length === 4).length,
    questionsWithOneCorrectOption: rows.filter(q => q.options.filter(o => o.isCorrect).length === 1).length,
    unreviewedQuestions: rows.filter(q => q.reviewStatus === "UNREVIEWED").length,
    totalSharedQuestionsIncludingRetired: await prisma.assessmentQuestion.count({ where: { origin: "BANK" } }),
    retainedTutorQuestions: await prisma.assessmentQuestion.count({ where: { origin: "TUTOR" } }),
    retainedAssessmentAttempts: await prisma.assessmentAttempt.count(),
    retainedPublishedTests: await prisma.sessionTest.count({ where: { status: "PUBLISHED" } }),
  };
  console.log("KATUWANG_QUESTION_REPLACEMENT_VERIFIED", JSON.stringify(summary));
}
main().catch(error => {
  let message = error instanceof Error ? error.message : "Question replacement failed";
  if (process.env.DATABASE_URL) message = message.replaceAll(process.env.DATABASE_URL, "[DATABASE_URL]");
  console.error("KATUWANG_QUESTION_REPLACEMENT_FAILED", message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
