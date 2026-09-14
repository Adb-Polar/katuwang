import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config as loadEnv } from "dotenv";
import { SUBJECT_TOPICS } from "../src/lib/subjectTopics";

// Seeds only the essentials a fresh deploy needs to function — no dummy
// users, classes, or demo data:
//   - id_counters: TUTOR / LEARNER / CLASS rows (registration IDs + class codes)
//   - subjects / topics: the canonical catalogue from SUBJECT_TOPICS
// Safe to re-run; existing rows are left untouched / kept in sync by slug or name.
loadEnv();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const SUBJECT_NAMES: Record<string, string> = {
  MATH: "Mathematics",
  ENGLISH: "English",
  SCIENCE: "Science",
  FILIPINO: "Filipino",
  ARALING_PANLIPUNAN: "Araling Panlipunan",
  TLE: "Technology & Livelihood Education",
  MAPEH: "MAPEH",
};

async function seedIdCounters() {
  for (const role of ["TUTOR", "LEARNER", "CLASS"] as const) {
    await prisma.idCounter.upsert({
      where: { role },
      create: { role, count: 0 },
      update: {},
    });
  }
  console.log("IdCounter rows ensured for TUTOR, LEARNER, CLASS.");
}

async function seedSubjectsAndTopics() {
  let sOrder = 0;
  for (const slug of Object.keys(SUBJECT_TOPICS)) {
    const subject = await prisma.subject.upsert({
      where: { slug },
      update: { name: SUBJECT_NAMES[slug] ?? slug, order: sOrder },
      create: { slug, name: SUBJECT_NAMES[slug] ?? slug, order: sOrder },
    });
    sOrder++;

    let tOrder = 0;
    for (const name of SUBJECT_TOPICS[slug]) {
      await prisma.topic.upsert({
        where: { subjectId_name: { subjectId: subject.id, name } },
        update: { order: tOrder },
        create: { subjectId: subject.id, name, order: tOrder },
      });
      tOrder++;
    }
  }
  console.log(`Subject/Topic catalogue ensured (${Object.keys(SUBJECT_TOPICS).length} subjects).`);
}

async function main() {
  await seedIdCounters();
  await seedSubjectsAndTopics();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
