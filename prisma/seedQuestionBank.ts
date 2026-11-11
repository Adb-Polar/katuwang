import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { loadQuestionBank } from "./questionBankData";

export interface QuestionSeedOptions {
  db?: PrismaClient;
  authorId?: string;
  subject?: string;
  topic?: string;
  dryRun?: boolean;
}
const contentKey = (q: { subject: string; topic: string; prompt: string }) => JSON.stringify([q.subject, q.topic, q.prompt.trim().toLowerCase()]);
const topicKey = (subject: string, topic: string) => JSON.stringify([subject, topic]);

/** Append validated drafts only. Never update/delete existing content, reviews or history. */
export async function seedQuestionBankDatabase(options: QuestionSeedOptions = {}) {
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
    // Check the catalog before making any writes, including disabled entries.
    const subjects = await tx.subject.findMany({ where: { slug: { in: [...new Set(selected.map(q => q.subject))] } }, include: { topics: true } });
    const available = new Set(subjects.flatMap(s => s.topics.map(t => topicKey(s.slug, t.name))));
    const missing = selected.find(q => !available.has(topicKey(q.subject, q.topic)));
    if (missing) throw Error(`Missing catalog topic ${missing.subject}: ${missing.topic}. Run pnpm seed first.`);
    const existing = await tx.assessmentQuestion.findMany({
      where: { OR: [{ subject: { in: [...new Set(selected.map(q => q.subject))] } }, { id: { in: selected.map(q => q.id) } }] },
      select: { id: true, subject: true, topic: true, prompt: true, origin: true },
    });
    const existingIds = new Map(existing.map(q => [q.id, q]));
    const existingContent = new Set(existing.filter(q => q.origin === "BANK").map(contentKey));
    const pending = selected.filter(q => {
      const old = existingIds.get(q.id);
      if (old && (old.subject !== q.subject || old.topic !== q.topic || old.origin !== "BANK")) throw Error(`Question ID belongs to a different topic or owner: ${q.id}`);
      return !old && !existingContent.has(contentKey(q));
    });
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
    return {
      revision: bank.revision, dryRun: Boolean(options.dryRun),
      totalSubjects: new Set(selected.map(q => q.subject)).size,
      totalTopics: new Set(selected.map(q => topicKey(q.subject, q.topic))).size,
      selectedQuestions: selected.length, skippedQuestions: selected.length - pending.length,
      totalQuestions: options.dryRun ? 0 : pending.length, totalOptions: options.dryRun ? 0 : pending.length * 4,
      pendingQuestions: pending.length, reviewStatus: "UNREVIEWED" as const,
    };
  }, { timeout: 180000, isolationLevel: "Serializable" });
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(["--validate", "--dry-run", "--author-id", "--subject", "--topic"]);
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!allowed.has(arg)) throw Error(`Unknown argument: ${arg}`);
    if (["--author-id", "--subject", "--topic"].includes(arg)) {
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
    console.log(await seedQuestionBankDatabase({ db: prisma, authorId: values["--author-id"] ?? process.env.SEED_QUESTION_AUTHOR_ID, subject: values["--subject"], topic: values["--topic"], dryRun: flags.has("--dry-run") }));
  } finally { await prisma.$disconnect(); }
}
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : "Question seed failed"); process.exitCode = 1; });
