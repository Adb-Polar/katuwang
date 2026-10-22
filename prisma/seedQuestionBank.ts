import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/prisma";
import { generateQuestionsForTopic } from "./questionBankData";

let idCounter = 0;
function generateCuid(): string {
  idCounter++;
  const timestamp = Date.now().toString(36);
  const seq = idCounter.toString(36).padStart(6, "0");
  const rand = Math.random().toString(36).slice(2, 8);
  return `c${timestamp}${seq}${rand}`.slice(0, 25);
}

export async function seedQuestionBankDatabase() {
  console.log("=== Katuwang Philippine K-12 Assessment Question Bank Seed ===");

  // 1. Resolve Admin Creator ID
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { id: true, email: true },
  });

  if (!adminUser) {
    throw new Error("No admin account found in database. Please run super-admin seed first.");
  }
  console.log(`Using admin author: ${adminUser.email} (${adminUser.id})`);

  // 2. Clear Question Bank and dependent attempt records
  console.log("\n[1/4] Clearing existing question bank and related test items...");
  const delTestAttemptItems = await prisma.sessionTestAttemptItem.deleteMany({});
  const delSessionQuestions = await prisma.sessionTestQuestion.deleteMany({});
  const delAttemptItems = await prisma.assessmentAttemptItem.deleteMany({});
  const delAttempts = await prisma.assessmentAttempt.deleteMany({});
  const delOptions = await prisma.assessmentOption.deleteMany({});
  const delQuestions = await prisma.assessmentQuestion.deleteMany({});

  console.log(`  - Deleted ${delTestAttemptItems.count} session test attempt items.`);
  console.log(`  - Deleted ${delSessionQuestions.count} session test questions.`);
  console.log(`  - Deleted ${delAttemptItems.count} assessment attempt items.`);
  console.log(`  - Deleted ${delAttempts.count} assessment attempts.`);
  console.log(`  - Deleted ${delOptions.count} assessment options.`);
  console.log(`  - Deleted ${delQuestions.count} bank questions.`);
  console.log("Question bank cleared cleanly.\n");

  // 3. Load active subjects and topics from database
  console.log("[2/4] Fetching active subjects and topics from database...");
  const subjects = await prisma.subject.findMany({
    where: { active: true },
    include: {
      topics: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
  console.log(`Discovered ${subjects.length} subjects and ${totalTopics} topics to populate.`);

  // Load curriculum dataset for competency hints if available
  const datasetPath = path.resolve(__dirname, "data/curriculum/curriculum_dataset.json");
  const competencyMap = new Map<string, string>();
  if (fs.existsSync(datasetPath)) {
    try {
      const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
      for (const item of dataset) {
        const key = `${item.subjectSlug}::${item.topic}`;
        if (!competencyMap.has(key) && item.learningCompetency) {
          competencyMap.set(key, item.learningCompetency);
        }
      }
    } catch (e) {
      console.warn("Could not parse curriculum_dataset.json for competency hints:", e);
    }
  }

  // 4. Generate 15 questions per topic
  console.log("\n[3/4] Generating 15 assessment questions per topic...");
  interface DbQuestion {
    id: string;
    subject: string;
    topic: string;
    prompt: string;
    explanation: string | null;
    active: boolean;
    origin: "BANK";
    createdById: string;
  }

  interface DbOption {
    id: string;
    questionId: string;
    text: string;
    isCorrect: boolean;
    position: number;
  }

  const allQuestions: DbQuestion[] = [];
  const allOptions: DbOption[] = [];

  let topicCounter = 0;
  for (const s of subjects) {
    for (const t of s.topics) {
      topicCounter++;
      const hint = competencyMap.get(`${s.slug}::${t.name}`);
      const generated = generateQuestionsForTopic(s.slug, s.name, t.name, hint);

      for (const q of generated) {
        const questionId = generateCuid();
        allQuestions.push({
          id: questionId,
          subject: s.slug,
          topic: t.name,
          prompt: q.prompt,
          explanation: q.explanation || null,
          active: true,
          origin: "BANK",
          createdById: adminUser.id,
        });

        q.options.forEach((opt, pos) => {
          allOptions.push({
            id: generateCuid(),
            questionId,
            text: opt.text,
            isCorrect: opt.isCorrect,
            position: pos,
          });
        });
      }
    }
    console.log(`  Prepared questions for [${s.slug}] ${s.name} (${s.topics.length} topics).`);
  }

  console.log(`\nGenerated a total of ${allQuestions.length} questions and ${allOptions.length} options.`);

  // 5. Bulk insert into database
  console.log("\n[4/4] Inserting records into MariaDB...");
  const BATCH_SIZE_Q = 250;
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE_Q) {
    const chunk = allQuestions.slice(i, i + BATCH_SIZE_Q);
    await prisma.assessmentQuestion.createMany({ data: chunk });
    const percent = Math.min(100, Math.round(((i + chunk.length) / allQuestions.length) * 100));
    process.stdout.write(`  Questions progress: ${i + chunk.length}/${allQuestions.length} (${percent}%)\r`);
  }
  console.log(`\n  Successfully inserted ${allQuestions.length} questions.`);

  const BATCH_SIZE_OPT = 500;
  for (let i = 0; i < allOptions.length; i += BATCH_SIZE_OPT) {
    const chunk = allOptions.slice(i, i + BATCH_SIZE_OPT);
    await prisma.assessmentOption.createMany({ data: chunk });
    const percent = Math.min(100, Math.round(((i + chunk.length) / allOptions.length) * 100));
    process.stdout.write(`  Options progress: ${i + chunk.length}/${allOptions.length} (${percent}%)\r`);
  }
  console.log(`\n  Successfully inserted ${allOptions.length} options.`);

  // 6. Re-link existing SessionTest records to new questions
  console.log("\nSynchronizing existing SessionTest items with new question bank...");
  const sessionTests = await prisma.sessionTest.findMany({
    include: {
      session: {
        select: {
          topic: true,
          class: { select: { subject: true } },
        },
      },
    },
  });

  for (const st of sessionTests) {
    const sub = st.session.class.subject;
    const top = st.session.topic;
    const candidateQuestions = await prisma.assessmentQuestion.findMany({
      where: { origin: "BANK", subject: sub, topic: top, active: true },
      take: 5,
      select: { id: true },
    });

    if (candidateQuestions.length > 0) {
      await prisma.sessionTestQuestion.createMany({
        data: candidateQuestions.map((q, idx) => ({
          id: generateCuid(),
          sessionTestId: st.id,
          questionId: q.id,
          position: idx,
        })),
      });
      console.log(`  Linked ${candidateQuestions.length} questions to SessionTest "${st.title}" (${sub} / ${top}).`);
    }
  }

  // 7. Ensure platform settings
  for (const [key, value] of [
    ["assessmentQuestionCount", "5"],
    ["assessmentPassPercent", "60"],
    ["assessmentMinBankSize", "5"],
  ] as const) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  console.log("\n=======================================================");
  console.log("  Question Bank Seeding Completed Successfully");
  console.log("=======================================================");
  console.log(`  - Subjects Populated:       ${subjects.length}`);
  console.log(`  - Topics Populated:         ${totalTopics}`);
  console.log(`  - Questions per Topic:      15`);
  console.log(`  - Total Questions in Bank:  ${allQuestions.length}`);
  console.log(`  - Total Options Created:    ${allOptions.length}`);
  console.log("=======================================================\n");

  return {
    totalSubjects: subjects.length,
    totalTopics,
    totalQuestions: allQuestions.length,
    totalOptions: allOptions.length,
  };
}

// Execute directly if run as main script
seedQuestionBankDatabase()
  .catch((err) => {
    console.error("Error seeding question bank:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
