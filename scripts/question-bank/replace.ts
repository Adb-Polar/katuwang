import { Prisma, type PrismaClient } from '@prisma/client';
import { bankSchema, validateBank } from './validate';

export type ReplacementMode = 'preview' | 'apply';

/**
 * Direct replacement for the explicitly disposable dummy BANK dataset.
 * No export, archive, or second approval prompt. All content gates run before
 * the first write. Subjects, topics, users and tutor-authored questions survive.
 */
export async function replaceDummyBank(db: PrismaClient, input: unknown, mode: ReplacementMode) {
  const bank = bankSchema.parse(input);
  return db.$transaction(async tx => {
    const subjects = await tx.subject.findMany({
      where:{active:true},orderBy:{id:'asc'},include:{topics:{where:{active:true},orderBy:{id:'asc'}}},
    });
    const inventory = subjects.flatMap(s => s.topics.map(t => ({
      subject:s.slug, subjectName:s.name, subjectId:s.id, topic:t.name, topicId:t.id,
      educationalLevel:null, existingActiveBankCount:null,
    })));
    const validation = validateBank(bank, inventory);
    if (!validation.valid) {
      throw new Error(`Replacement rejected before any writes: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    // The user authorized seeding without academic review. Do not invent review
    // attestations or alter the application's separate qualification controls.
    if (validation.reviewFlags.length) {
      throw new Error(`Replacement rejected before any writes: ${validation.reviewFlags.length} unresolved content review flags.`);
    }
    const settings = await tx.platformSetting.findMany({where:{key:{in:['assessmentQuestionCount','assessmentMinBankSize']}}});
    if (settings.some(s => Number(s.value)>20)) throw new Error('Assessment settings require more than 20 questions per topic.');
    const author = await tx.user.findFirst({where:{role:{in:['SUPER_ADMIN','ADMIN']}},orderBy:{id:'asc'},select:{id:true}});
    if (!author) throw new Error('An existing administrator author is required; no users will be created.');
    const old = await tx.assessmentQuestion.findMany({where:{origin:'BANK'},select:{id:true}});
    const oldIds = old.map(q => q.id);
    const affectedTests = oldIds.length ? await tx.sessionTest.findMany({
      where:{questions:{some:{questionId:{in:oldIds}}}},select:{id:true},
    }) : [];
    const testIds = affectedTests.map(t => t.id);
    const summary = {
      mode, databaseModified:mode==='apply', bankId:bank.bankId,
      subjects:subjects.length,topics:inventory.length,deleteBankQuestions:oldIds.length,
      insertBankQuestions:bank.questions.length,resetSessionTests:testIds.length,
      dependentDummyAttemptsWillBeDeleted:true,backupRequired:false,
    };
    if (mode==='preview') return summary;

    // Remove all attempts on affected tests, including PRE/POST pairs. Leaving
    // their old scores alongside a changed test would misrepresent its results.
    if (oldIds.length) {
      await tx.assessmentAttempt.deleteMany({where:{items:{some:{questionId:{in:oldIds}}}}});
      await tx.sessionTestAttempt.deleteMany({where:{OR:[
        {sessionTestId:{in:testIds}}, {items:{some:{questionId:{in:oldIds}}}},
      ]}});
      await tx.sessionTestQuestion.deleteMany({where:{questionId:{in:oldIds}}});
      if (testIds.length) await tx.sessionTest.updateMany({where:{id:{in:testIds}},data:{
        status:'DRAFT',publishedAt:null,closedAt:null,
      }});
      // Successors can otherwise block deletion through the Restrict version FK.
      // All BANK versions are disposable; retain surviving question content.
      await tx.assessmentQuestion.updateMany({where:{previousVersionId:{in:oldIds}},data:{previousVersionId:null}});
      // Options cascade on question deletion after dependent references are gone.
      await tx.assessmentQuestion.deleteMany({where:{id:{in:oldIds},origin:'BANK'}});
    }
    for (const q of bank.questions) {
      await tx.assessmentQuestion.create({data:{
        id:q.id,subject:q.subject,topic:q.topic,prompt:q.prompt,explanation:q.explanation,
        origin:'BANK',active:true,createdById:author.id,
        options:{create:q.options.map((o,position) => ({...o,position}))},
      }});
    }
    const inserted = await tx.assessmentQuestion.findMany({where:{origin:'BANK'},include:{options:true}});
    if (inserted.length!==bank.questions.length) throw new Error('Post-replacement total mismatch. Transaction will roll back.');
    for (const t of inventory) {
      const questions = inserted.filter(q => q.subject===t.subject && q.topic===t.topic && q.active);
      if (questions.length!==20 || questions.some(q => q.options.length!==4 || q.options.filter(o => o.isCorrect).length!==1)) {
        throw new Error(`Post-replacement validation failed for ${t.subject}/${t.topic}. Transaction will roll back.`);
      }
    }
    return summary;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000,maxWait:10000});
}
