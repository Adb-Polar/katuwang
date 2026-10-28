import { prisma } from "../src/lib/prisma";
import { seedSubjectCatalog } from "./seedSubjectCatalog";

/** The historical competency dataset stays as evidence, not a competing dropdown taxonomy. */
export async function seedCurriculumDatabase() { return seedSubjectCatalog(prisma); }
seedCurriculumDatabase().then((result) => console.log(result))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
