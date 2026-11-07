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
  console.log("Using the configured admin author for demo content.");

  // Append demo content only. Never delete attempts or replace published links.
  const existing = await prisma.assessmentQuestion.findMany({ where: { origin: "BANK" }, select: { subject: true, topic: true, prompt: true } });
  const existingKeys = new Set(existing.map(q => `${q.subject}::${q.topic}::${q.prompt}`));

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
    reviewStatus: "DEMO";
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

  for (const s of subjects) {
    for (const t of s.topics) {
      const hint = competencyMap.get(`${s.slug}::${t.name}`);
      const generated = generateQuestionsForTopic(s.slug, s.name, t.name, hint);

      for (const q of generated) {
        const key = `${s.slug}::${t.name}::${q.prompt}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        const questionId = generateCuid();
        allQuestions.push({
          id: questionId,
          subject: s.slug,
          topic: t.name,
          prompt: q.prompt,
          explanation: q.explanation || null,
          active: true,
          origin: "BANK",
          reviewStatus: "DEMO",
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

  // Insert each batch with its options atomically; retain all existing history.
  console.log("Appending demonstration questions (not eligible for certification).");
  for (let i = 0; i < allQuestions.length; i += 250) {
    const chunk = allQuestions.slice(i, i + 250);
    const ids = new Set(chunk.map(q => q.id));
    await prisma.$transaction(async tx => {
      await tx.assessmentQuestion.createMany({ data: chunk });
      await tx.assessmentOption.createMany({ data: allOptions.filter(o => ids.has(o.questionId)) });
    });
  }

  // Assessment policy is managed separately; demo seeding must not change it.

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

// Importable for isolated verification; execute only as the main script.
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) seedQuestionBankDatabase()
  .catch((err) => {
    console.error("Error seeding question bank:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
