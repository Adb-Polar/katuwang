/** Update only curriculum metadata on existing canonical entries. Never seed demo users/classes. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { curriculumFor } from "../src/lib/curriculum";

const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.set("connectTimeout", "10000");
databaseUrl.searchParams.set("acquireTimeout", "10000");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl.toString()) });
const apply = process.argv.includes("--apply");
async function main() {
  const subjects = await prisma.subject.findMany({ include: { topics: true } });
  const unknown: string[] = [];
  let subjectCount = 0, topicCount = 0;
  // A single transaction keeps all canonical mappings on the same revision.
  await prisma.$transaction(async (tx) => {
    for (const subject of subjects) {
      const mapping = curriculumFor(subject.slug);
      if (!mapping.curriculum) { unknown.push(subject.slug); continue; }
      if (apply) await tx.subject.update({ where: { id: subject.id }, data: mapping });
      subjectCount++;
      for (const topic of subject.topics) {
        const details = curriculumFor(subject.slug, topic.name);
        if (!details.curriculum) { unknown.push(`${subject.slug}: ${topic.name}`); continue; }
        if (apply) await tx.topic.update({ where: { id: topic.id }, data: details });
        topicCount++;
      }
    }
  }, { timeout: 30000 });
  console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", subjects: subjectCount, topics: topicCount, unassignedCustomEntries: unknown }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Curriculum backfill failed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
