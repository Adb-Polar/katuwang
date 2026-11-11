import { prisma } from "../src/lib/prisma";
import { seedSubjectCatalog } from "./seedSubjectCatalog";

/** Seed the researched Grade 7–12 catalog without creating demo or user records. */
async function main() {
  if (process.argv.includes("--reset")) {
    throw new Error("The curriculum seed does not reset user data. Run pnpm seed to import the subject/topic list safely.");
  }

  const result = await seedSubjectCatalog(prisma);
  console.log("Curriculum catalog seeded:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
