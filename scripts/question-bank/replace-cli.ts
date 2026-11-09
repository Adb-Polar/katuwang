import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { bankSchema } from './validate';
import { replaceDummyBank } from './replace';

async function main() {
  const args=process.argv.slice(2);
  if (args.length<1 || args.length>2 || (args.length===2 && args[1]!=='--apply')) {
    throw new Error('Usage: tsx scripts/question-bank/replace-cli.ts BANK_JSON [--apply]');
  }
  const path=resolve(args[0]);
  const bank=bankSchema.parse(JSON.parse(await readFile(path,'utf8')));
  for (const source of bank.sources) {
    const data=await readFile(resolve(dirname(path),source.evidenceFile));
    if (createHash('sha256').update(data).digest('hex')!==source.evidenceSha256) {
      throw new Error(`Research evidence mismatch: ${source.id}`);
    }
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured. No database connection or write was attempted.');
  const {prisma:db}=await import('../../src/lib/prisma');
  try {
    console.log(JSON.stringify(await replaceDummyBank(db,bank,args.includes('--apply')?'apply':'preview'),null,2));
  } finally { await db.$disconnect(); }
}
main().catch(e => {
  // Avoid leaking connection credentials through adapter error text.
  const message=e instanceof Error ? e.message : 'Replacement failed';
  console.error(/mysql:\/\/|mariadb:\/\//i.test(message) ? 'Database operation failed; inspect the connection securely.' : message);
  process.exitCode=1;
});
