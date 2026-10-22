import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/prisma";
import { SUBJECT_TOPICS } from "../src/lib/subjectTopics";


interface CurriculumRecord {
  subjectSlug: string;
  subjectName: string;
  gradeLevel: string;
  quarterOrTerm: string;
  unitOrContentDomain: string;
  topic: string;
  subtopic: string;
  learningCompetency: string;
  competencyCode: string;
  curriculumVersion: string;
  trackOrStrand: string;
  sourceTitle: string;
  sourceUrl: string;
  pageNumber: string;
  verificationStatus: string;
}

export async function seedCurriculumDatabase(options: { clean?: boolean } = {}) {
  console.log("=== Katuwang Philippine K-12 Curriculum Seed ===");

  const shouldClean = options.clean ?? process.argv.includes("--clean");
  if (shouldClean) {
    console.log("Deleting all existing topics and subjects from database...");
    const deletedTopics = await prisma.topic.deleteMany({});
    const deletedSubjects = await prisma.subject.deleteMany({});
    console.log(`Successfully deleted ${deletedTopics.count} topics and ${deletedSubjects.count} subjects.`);
  }

  const datasetPath = path.resolve(__dirname, "data/curriculum/curriculum_dataset.json");
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Curriculum dataset not found at ${datasetPath}`);
  }

  const rawData = fs.readFileSync(datasetPath, "utf-8");
  const dataset: CurriculumRecord[] = JSON.parse(rawData);
  console.log(`Loaded ${dataset.length} verified curriculum competencies from dataset.`);

  // 1. Group records by subject and collect unique topics
  const subjectsMap = new Map<string, { name: string; topics: Set<string> }>();

  // Ensure default existing subjects from SUBJECT_TOPICS are preserved first
  const DEFAULT_SUBJECT_NAMES: Record<string, string> = {
    MATH: "Mathematics",
    ENGLISH: "English",
    SCIENCE: "Science",
    FILIPINO: "Filipino",
    ARALING_PANLIPUNAN: "Araling Panlipunan",
    TLE: "Technology & Livelihood Education",
    MAPEH: "MAPEH",
  };

  for (const [slug, name] of Object.entries(DEFAULT_SUBJECT_NAMES)) {
    subjectsMap.set(slug, {
      name,
      topics: new Set(SUBJECT_TOPICS[slug] ?? []),
    });
  }

  // Merge records from the curriculum dataset
  for (const item of dataset) {
    const slug = item.subjectSlug;
    if (!subjectsMap.has(slug)) {
      subjectsMap.set(slug, {
        name: item.subjectName,
        topics: new Set<string>(),
      });
    }
    const entry = subjectsMap.get(slug)!;
    if (item.topic && item.topic.trim()) {
      entry.topics.add(item.topic.trim());
    }
  }

  console.log(`Discovered ${subjectsMap.size} distinct subjects to ensure in database.`);

  let sOrder = 0;
  let totalSubjectsUpserted = 0;
  let totalTopicsUpserted = 0;

  for (const [slug, data] of subjectsMap.entries()) {
    const subject = await prisma.subject.upsert({
      where: { slug },
      update: {
        name: data.name,
        order: sOrder,
        active: true,
      },
      create: {
        slug,
        name: data.name,
        order: sOrder,
        active: true,
      },
    });
    totalSubjectsUpserted++;
    sOrder++;

    let tOrder = 0;
    for (const topicName of Array.from(data.topics)) {
      await prisma.topic.upsert({
        where: {
          subjectId_name: {
            subjectId: subject.id,
            name: topicName,
          },
        },
        update: {
          order: tOrder,
          active: true,
        },
        create: {
          subjectId: subject.id,
          name: topicName,
          order: tOrder,
          active: true,
        },
      });
      totalTopicsUpserted++;
      tOrder++;
    }
    console.log(`[${sOrder}/${subjectsMap.size}] Upserted subject ${slug} (${data.name}) with ${data.topics.size} topics.`);
  }

  console.log(`Successfully upserted ${totalSubjectsUpserted} subjects and ${totalTopicsUpserted} topics.`);
  console.log("Curriculum seed completed safely without duplicate creation or record loss.");
  return { totalSubjectsUpserted, totalTopicsUpserted };
}

seedCurriculumDatabase()
  .catch((err) => {
    console.error("Error seeding curriculum:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

