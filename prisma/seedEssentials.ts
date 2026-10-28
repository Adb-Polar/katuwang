import { seedSubjectCatalog } from "./seedSubjectCatalog";
import { prisma } from "../src/lib/prisma";
import { config as loadEnv } from "dotenv";

// Seeds only the essentials a fresh deploy needs to function — no dummy
// users, classes, or demo data:
//   - id_counters: TUTOR / LEARNER / CLASS rows (registration IDs + class codes)
//   - subjects / topics: the canonical catalogue from SUBJECT_TOPICS
// Safe to re-run; existing rows are left untouched / kept in sync by slug or name.
loadEnv();


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
  console.log(await seedSubjectCatalog(prisma));
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
