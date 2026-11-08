/** Read-only preparation tool. It deliberately has NO activation command. */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SUBJECT_TOPICS } from '../../src/lib/subjectTopics';
import { digest, validateBank, type InventoryTopic } from './validate';

const names: Record<string,string> = {MATH:'Mathematics',ENGLISH:'English',SCIENCE:'Science',FILIPINO:'Filipino',ARALING_PANLIPUNAN:'Araling Panlipunan',TLE:'Technology & Livelihood Education',MAPEH:'MAPEH'};
async function save(path: string, value: unknown) {
  await mkdir(dirname(resolve(path)), {recursive:true});
  // Refuse accidental replacement of an existing backup/report.
  await writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
}
async function load(path: string) { return JSON.parse(await readFile(path,'utf8')); }
async function main() {
  const [command,...args] = process.argv.slice(2);
  if (command === 'inventory-seed' && args.length===1) {
    const inventory: InventoryTopic[] = Object.entries(SUBJECT_TOPICS).flatMap(([subject,topics]) => topics.map(topic => ({
      subject,subjectName:names[subject] ?? subject,subjectId:null,topic,topicId:null,educationalLevel:null,
      existingActiveBankCount:null,
    })));
    await save(args[0],{source:'seed-fallback',authoritativeForProduction:false,inventory,
      subjectCount:Object.keys(SUBJECT_TOPICS).length,topicCount:inventory.length,expectedQuestionCount:inventory.length*20,
      warning:'Database IDs and production question counts are unknown. Live admins can extend the catalogue.'});
    return;
  }
  if (command === 'export-db' && args.length===1) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Configure a read-only account; no seed fallback is used.');
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb');
    const db = new PrismaClient({adapter:new PrismaMariaDb(process.env.DATABASE_URL)});
    try {
      const snapshot = await db.$transaction(async tx => {
        const subjects = await tx.subject.findMany({orderBy:{id:'asc'},include:{topics:{orderBy:{id:'asc'}}}});
        const questions = await tx.assessmentQuestion.findMany({orderBy:{id:'asc'},include:{
          options:{orderBy:{position:'asc'}},
          _count:{select:{attemptItems:true,sessionTestLinks:true,sessionTestItems:true}},
        }});
        const links = await tx.sessionTestQuestion.findMany({orderBy:{id:'asc'},select:{
          questionId:true,sessionTestId:true,sessionTest:{select:{status:true}},
        }});
        const inventory = subjects.flatMap(s => s.topics.map(t => ({
          subject:s.slug,subjectName:s.name,subjectId:s.id,topic:t.name,topicId:t.id,
          educationalLevel:null, existingActiveBankCount:questions.filter(q => q.subject===s.slug && q.topic===t.name && q.origin==='BANK' && q.active).length,
        })));
        const settings = await tx.platformSetting.findMany({where:{key:{in:['assessmentQuestionCount','assessmentMinBankSize','assessmentPassPercent']}}});
        return {source:'database',authoritativeForProduction:true,exportedAt:new Date().toISOString(),subjects,inventory,questions,links,settings};
      },{isolationLevel:'RepeatableRead',timeout:120000});
      await save(args[0],{...snapshot,sha256:digest(snapshot)});
    } finally { await db.$disconnect(); }
    return;
  }
  if (command === 'validate' && args.length===3) {
    const [bank,inventory] = await Promise.all([load(args[0]),load(args[1])]);
    const report = validateBank(bank,inventory.inventory);
    // Source archives must exist and match their recorded evidence digests.
    if (Array.isArray(bank.sources)) for (const source of bank.sources) {
      try {
        const evidencePath = resolve(dirname(resolve(args[0])),source.evidenceFile);
        const {createHash} = await import('node:crypto');
        const hash = createHash('sha256').update(await readFile(evidencePath)).digest('hex');
        if (hash !== source.evidenceSha256) throw new Error('Evidence digest mismatch');
      } catch {
        report.valid=false; report.productionReady=false;
        report.errors.push({code:'SOURCE_EVIDENCE',message:`Missing or changed local evidence: ${source.id}`});
      }
    }
    await save(args[2],{bankSha256:digest(bank),...report});
    console.log(JSON.stringify({valid:report.valid,productionReady:report.productionReady,questionCount:report.questionCount,errors:report.errors.length}));
    if (!report.valid) process.exitCode=1;
    return;
  }
  if (command === 'dry-run' && args.length===3) {
    const [bank,snapshot] = await Promise.all([load(args[0]),load(args[1])]);
    const validation = validateBank(bank,snapshot.inventory);
    const blockers: string[] = [];
    if (!snapshot.authoritativeForProduction) blockers.push('No authoritative database snapshot.');
    if (!validation.productionReady) blockers.push('Incomplete validation or academic approval.');
    if (snapshot.authoritativeForProduction) {
      const {sha256,...payload} = snapshot;
      if (digest(payload)!==sha256) blockers.push('Database snapshot digest mismatch.');
    }
    const old = (snapshot.questions ?? []).filter((q:{origin:string;active:boolean}) => q.origin==='BANK' && q.active);
    const ids = new Set(old.map((q:{id:string}) => q.id));
    const openLinks = (snapshot.links ?? []).filter((l:{questionId:string;sessionTest:{status:string}}) => ids.has(l.questionId) && l.sessionTest.status!=='CLOSED');
    if (openLinks.length) blockers.push('Draft/published session tests still reference retiring questions. Resolve without changing historical attempts.');
    for (const s of snapshot.settings ?? []) if (['assessmentQuestionCount','assessmentMinBankSize'].includes(s.key) && Number(s.value)>20) blockers.push(`${s.key} exceeds replacement bank size.`);
    await save(args[2],{dryRun:true,databaseModified:false,bankSha256:digest(bank),snapshotSha256:snapshot.sha256 ?? null,
      activationImplemented:false,blockers,
      proposed:{archiveActiveBankQuestions:old.length,insertNewBankQuestions:bank.questions?.length ?? 0,
        deleteQuestions:0,deleteOptions:0,modifySubjects:0,modifyTopics:0,modifyUsers:0,modifyAttempts:0},
      openSessionTestLinks:openLinks,validation});
    return;
  }
  throw new Error('Usage: tsx scripts/question-bank/cli.ts inventory-seed OUT | export-db OUT | validate BANK INVENTORY REPORT | dry-run BANK SNAPSHOT REPORT');
}
main().catch(e => {console.error(e instanceof Error ? e.message : 'Question-bank preparation failed');process.exitCode=1;});
