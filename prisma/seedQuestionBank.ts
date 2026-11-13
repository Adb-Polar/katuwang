import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { loadQuestionBank } from "./questionBankData";
import { applySubjectCatalog } from "./seedSubjectCatalog";

export interface QuestionSeedOptions {
  db?: PrismaClient;
  authorId?: string;
  subject?: string;
  topic?: string;
  dryRun?: boolean;
  replace?: boolean;
  syncCatalog?: boolean;
  operationId?: string;
}
const contentKey = (q: { subject: string; topic: string; prompt: string }) => JSON.stringify([q.subject, q.topic, q.prompt.trim().toLowerCase()]);
const topicKey = (subject: string, topic: string) => JSON.stringify([subject, topic]);

/** Import validated drafts. Replacement retires superseded BANK items; history stays intact. */
export async function seedQuestionBankDatabase(options: QuestionSeedOptions = {}) {
  if (options.operationId && (!options.replace || options.subject || options.topic || !/^[a-zA-Z0-9_-]{1,80}$/.test(options.operationId))) throw Error("A valid operation ID requires an unscoped replacement");
  const bank = loadQuestionBank();
  const selected = bank.questions.filter(q => (!options.subject || q.subject === options.subject) && (!options.topic || q.topic === options.topic));
  if (!selected.length) throw Error("No question data matches the requested subject/topic");
  const db = options.db ?? (await import("../src/lib/prisma")).prisma;
  const admin = await db.user.findFirst({
    where: { ...(options.authorId ? { id: options.authorId } : {}), role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: [{ role: "desc" }, { id: "asc" }], select: { id: true },
  });
  if (!admin) throw Error("An existing ADMIN or SUPER_ADMIN author is required. Run pnpm seed:super-admin first or supply --author-id.");
  const result = await db.$transaction(async tx => {
    const operationKey = options.operationId ? `questionBankReplacement:${options.operationId}` : undefined;
    if (operationKey) {
      const prior = await tx.platformSetting.findUnique({ where: { key: operationKey } });
      if (prior) {
        if (JSON.parse(prior.value).revision !== bank.revision) throw Error("Operation ID was used for a different question-bank revision");
        return { revision: bank.revision, dryRun: Boolean(options.dryRun), totalSubjects: new Set(selected.map(q => q.subject)).size, totalTopics: new Set(selected.map(q => topicKey(q.subject, q.topic))).size, selectedQuestions: selected.length, skippedQuestions: selected.length, totalQuestions: 0, totalOptions: 0, pendingQuestions: 0, questionsToRetire: 0, retiredQuestions: 0, alreadyApplied: true, reviewStatus: "UNREVIEWED" as const };
      }
    }
    if (options.syncCatalog && !options.dryRun) await applySubjectCatalog(tx);
    // Check the catalog before making any question writes, including disabled entries.
    const subjects = await tx.subject.findMany({ where: { slug: { in: [...new Set(selected.map(q => q.subject))] } }, include: { topics: true } });
    const available = new Set(subjects.flatMap(s => s.topics.map(t => topicKey(s.slug, t.name))));
    const missing = selected.find(q => !available.has(topicKey(q.subject, q.topic)));
    if (missing && !options.syncCatalog) throw Error(`Missing catalog topic ${missing.subject}: ${missing.topic}. Run pnpm seed first.`);
    const existing = await tx.assessmentQuestion.findMany({
      where: { OR: [options.replace ? { origin: "BANK" } : { subject: { in: [...new Set(selected.map(q => q.subject))] } }, { id: { in: selected.map(q => q.id) } }] },
      orderBy: { id: "asc" },
      select: { id: true, subject: true, topic: true, prompt: true, origin: true, active: true },
    });
    const existingIds = new Map(existing.map(q => [q.id, q]));
    const existingContent = new Map(existing.filter(q => q.origin === "BANK").map(q => [contentKey(q), q.id]));
    const pending = selected.filter(q => {
      const old = existingIds.get(q.id);
      if (old && (old.subject !== q.subject || old.topic !== q.topic || old.origin !== "BANK")) throw Error(`Question ID belongs to a different topic or owner: ${q.id}`);
      return !old && !existingContent.has(contentKey(q));
    });
    const keptIds = new Set(selected.map(q => existingIds.has(q.id) ? q.id : existingContent.get(contentKey(q)) ?? q.id));
    const retiring = options.replace ? existing.filter(q => q.origin === "BANK" && q.active && !keptIds.has(q.id) && (!options.subject || q.subject === options.subject) && (!options.topic || q.topic === options.topic)) : [];
    if (!options.dryRun) {
      for (let i = 0; i < pending.length; i += 100) {
        const batch = pending.slice(i, i + 100);
        await tx.assessmentQuestion.createMany({ data: batch.map(q => ({
          id: q.id, subject: q.subject, topic: q.topic, prompt: q.prompt, explanation: q.explanation,
          createdById: admin.id, origin: "BANK", reviewStatus: "UNREVIEWED", active: true,
        })) });
        await tx.assessmentOption.createMany({ data: batch.flatMap(q => q.options.map((o, position) => ({
          id: "c" + createHash("sha256").update(`${q.id}\0option\0${position}`).digest("hex").slice(0, 24),
          questionId: q.id, text: o.text, isCorrect: o.isCorrect, position,
        }))) });
      }
    }
    if (!options.dryRun && retiring.length) await tx.assessmentQuestion.updateMany({ where: { id: { in: retiring.map(q => q.id) } }, data: { active: false } });
    const result = {
      revision: bank.revision, dryRun: Boolean(options.dryRun),
      totalSubjects: new Set(selected.map(q => q.subject)).size,
      totalTopics: new Set(selected.map(q => topicKey(q.subject, q.topic))).size,
      selectedQuestions: selected.length, skippedQuestions: selected.length - pending.length,
      totalQuestions: options.dryRun ? 0 : pending.length, totalOptions: options.dryRun ? 0 : pending.length * 4,
      pendingQuestions: pending.length, questionsToRetire: retiring.length, retiredQuestions: options.dryRun ? 0 : retiring.length, alreadyApplied: false, reviewStatus: "UNREVIEWED" as const,
    };
    if (operationKey && !options.dryRun) await tx.platformSetting.create({ data: { key: operationKey, value: JSON.stringify({ revision: bank.revision, completedAt: new Date().toISOString(), importedQuestions: pending.length, retiredQuestions: retiring.length }) } });
    return result;
  }, { timeout: 180000, isolationLevel: "Serializable" });
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(["--validate", "--dry-run", "--author-id", "--subject", "--topic", "--replace", "--with-catalog", "--operation-id"]);
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!allowed.has(arg)) throw Error(`Unknown argument: ${arg}`);
    if (["--author-id", "--subject", "--topic", "--operation-id"].includes(arg)) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw Error(`Missing value for ${arg}`);
      values[arg] = args[++i];
    } else flags.add(arg);
  }
  if (flags.has("--validate")) {
    const bank = loadQuestionBank();
    console.log(`Validated ${bank.questions.length} draft questions, ${bank.questions.length / 20} topics, 20 per topic. No database connection.`);
    return;
  }
  const { prisma } = await import("../src/lib/prisma");
  try {
    console.log(await seedQuestionBankDatabase({ db: prisma, authorId: values["--author-id"] ?? process.env.SEED_QUESTION_AUTHOR_ID, subject: values["--subject"], topic: values["--topic"], dryRun: flags.has("--dry-run"), replace: flags.has("--replace"), syncCatalog: flags.has("--with-catalog"), operationId: values["--operation-id"] }));
  } finally { await prisma.$disconnect(); }
}
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : "Question seed failed"); process.exitCode = 1; });
