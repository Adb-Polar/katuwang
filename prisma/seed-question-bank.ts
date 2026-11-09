/** Standalone question-bank seed. Never invokes the demo-user/class seed. */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { bankSchema, validateBank } from '../scripts/question-bank/validate';
import { SUBJECT_TOPICS } from '../src/lib/subjectTopics';
import { replaceDummyBank } from '../scripts/question-bank/replace';
import { bankCoverage, coverageFailureMessage } from '../scripts/question-bank/coverage';

export const DEFAULT_BANK_PATH = fileURLToPath(new URL('./question-bank/questions.json', import.meta.url));

export async function inspectQuestionSeed(path = DEFAULT_BANK_PATH) {
  const bank = bankSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  for (const source of bank.sources) {
    const record = await readFile(resolve(dirname(path), source.evidenceFile));
    if (createHash('sha256').update(record).digest('hex') !== source.evidenceSha256) {
      throw new Error(`Research record changed or invalid: ${source.id}`);
    }
  }
  const inventory = Object.entries(SUBJECT_TOPICS).flatMap(([subject, topics]) => topics.map(topic => ({
    subject, subjectName:subject, topic, subjectId:null, topicId:null,
    educationalLevel:null, existingActiveBankCount:null,
  })));
  const coverage = bankCoverage(bank, inventory);
  if (coverage.missing.length || coverage.unmatched.length) throw new Error(coverageFailureMessage(coverage));
  const validation = validateBank(bank, inventory);
  if (!validation.valid) throw new Error(validation.errors.map(e => e.message).join('\n'));
  return {bank, validation};
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--check', '--apply'].includes(arg)) || args.length > 1) {
    throw new Error('Usage: tsx prisma/seed-question-bank.ts [--check | --apply]');
  }
  const {bank, validation} = await inspectQuestionSeed();
  if (!args.includes('--apply')) {
    console.log(JSON.stringify({
      file:DEFAULT_BANK_PATH, databaseModified:false, subjects:Object.keys(SUBJECT_TOPICS).length,
      topics:validation.topics.length, questions:bank.questions.length,
      structurallyValid:validation.valid, academicReviewPending:validation.requiringManualReview,
      reviewFlags:validation.reviewFlags, productionApproved:validation.productionReady,
      academicReviewRequiredForSeeding:false, seedContentReady:validation.reviewFlags.length===0,
    },null,2));
    return;
  }
  // Academic review is informational for this authorized seed. Preserve the
  // genuine review metadata; structural checks and content flags still gate writes.
  if (validation.reviewFlags.length) {
    throw new Error(`Resolve ${validation.reviewFlags.length} content review flags before seeding.`);
  }
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the environment before seeding. No database writes were attempted.');
  const {prisma:db} = await import('../src/lib/prisma');
  try {
    console.log(JSON.stringify(await replaceDummyBank(db,bank,'apply'),null,2));
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const message = error instanceof Error ? error.message : 'Question seed failed';
    console.error(/mysql:\/\/|mariadb:\/\//i.test(message) ? 'Database operation failed; inspect the connection securely.' : message);
    process.exitCode = 1;
  });
}
