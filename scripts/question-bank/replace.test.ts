import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { PrismaClient } from '@prisma/client';
import { replaceDummyBank } from './replace';

const draft=JSON.parse(readFileSync('scripts/question-bank/fixtures/pilot-bank.json','utf8'));
// Academic attestations are synthetic test fixtures only; no production file is modified.
function approvedFixture() {
  const bank=structuredClone(draft);
  for (const q of bank.questions) {
    q.verificationStatus='academically-approved';
    q.review={reviewer:'TEST FIXTURE ONLY',date:q.researchDate,accuracy:true,relevance:true,level:true,distractors:true,originality:true,calculations:true};
  }
  return bank;
}
function mockDatabase() {
  const mutations:string[]=[];
  const created:Record<string,unknown>[]=[];
  const write=(name:string) => vi.fn(async()=>{mutations.push(name);return {count:1};});
  const tx={
    subject:{findMany:vi.fn(async()=>[{id:'s1',slug:'MATH',name:'Mathematics',topics:[{id:'t1',name:'Whole Numbers & Operations'}]}])},
    platformSetting:{findMany:vi.fn(async()=>[] as {key:string;value:string}[])},
    user:{findFirst:vi.fn(async()=>({id:'admin1'} as {id:string}|null))},
    assessmentQuestion:{
      findMany:vi.fn(async()=>{
        if (!created.length) return [{id:'dummy-bank-1'},{id:'dummy-bank-2'}];
        return created.map(q=>({...q,options:(q.options as {create:unknown[]}).create}));
      }),
      deleteMany:write('questions'),
      create:vi.fn(async({data}:{data:Record<string,unknown>})=>{mutations.push('insert');created.push(data);return data;}),
    },
    sessionTest:{findMany:vi.fn(async()=>[{id:'test1'}]),updateMany:write('tests')},
    assessmentAttempt:{deleteMany:write('certification-attempts')},
    sessionTestAttempt:{deleteMany:write('learner-attempts')},
    sessionTestQuestion:{deleteMany:write('links')},
  };
  let committed=false;
  const db={$transaction:vi.fn(async(fn:(t:typeof tx)=>Promise<unknown>)=>{
    const result=await fn(tx);committed=true;return result;
  })};
  return {db:db as unknown as PrismaClient,tx,mutations,created,committed:()=>committed};
}

describe('authorized direct dummy bank replacement',()=>{
  it('rejects an incomplete bank before any destructive operation',async()=>{
    const m=mockDatabase();
    m.tx.subject.findMany.mockResolvedValue([{id:'s1',slug:'MATH',name:'Mathematics',topics:[{id:'t1',name:'Whole Numbers & Operations'},{id:'t2',name:'Fractions & Decimals'}]}]);
    await expect(replaceDummyBank(m.db,approvedFixture(),'apply')).rejects.toThrow('Expected 20');
    expect(m.mutations).toEqual([]);expect(m.committed()).toBe(false);
  });
  it('does not turn unreviewed draft content into academic approval',async()=>{
    const m=mockDatabase();await expect(replaceDummyBank(m.db,draft,'apply')).rejects.toThrow('academic review');
    expect(m.mutations).toEqual([]);
  });
  it('previews deletions without making any writes or backup requirement',async()=>{
    const m=mockDatabase();const result=await replaceDummyBank(m.db,approvedFixture(),'preview');
    expect(result).toMatchObject({databaseModified:false,deleteBankQuestions:2,insertBankQuestions:20,resetSessionTests:1,backupRequired:false});
    expect(m.mutations).toEqual([]);
  });
  it('removes dependent dummy data before deleting BANK questions, then inserts the complete bank',async()=>{
    const m=mockDatabase();const result=await replaceDummyBank(m.db,approvedFixture(),'apply');
    expect(m.mutations.slice(0,5)).toEqual(['certification-attempts','learner-attempts','links','tests','questions']);
    expect(m.tx.assessmentQuestion.deleteMany).toHaveBeenCalledWith({where:{id:{in:['dummy-bank-1','dummy-bank-2']},origin:'BANK'}});
    expect(m.tx.sessionTest.updateMany).toHaveBeenCalledWith({where:{id:{in:['test1']}},data:{status:'DRAFT',publishedAt:null,closedAt:null}});
    expect(m.created).toHaveLength(20);
    expect(m.created[0]).toMatchObject({id:draft.questions[0].id,active:true,origin:'BANK',createdById:'admin1'});
    expect(result.databaseModified).toBe(true);expect(m.committed()).toBe(true);
  });
  it('does not commit when an insertion fails',async()=>{
    const m=mockDatabase();m.tx.assessmentQuestion.create.mockRejectedValue(new Error('insertion failed'));
    await expect(replaceDummyBank(m.db,approvedFixture(),'apply')).rejects.toThrow('insertion failed');
    expect(m.committed()).toBe(false);
  });
  it('requires successful post-insert validation before commit',async()=>{
    const m=mockDatabase();m.tx.assessmentQuestion.findMany.mockResolvedValue([{id:'dummy-bank-1'}]);
    await expect(replaceDummyBank(m.db,approvedFixture(),'apply')).rejects.toThrow('total mismatch');
    expect(m.committed()).toBe(false);
  });
  it('rejects incompatible settings before writes',async()=>{
    const m=mockDatabase();m.tx.platformSetting.findMany.mockResolvedValue([{key:'assessmentMinBankSize',value:'25'}]);
    await expect(replaceDummyBank(m.db,approvedFixture(),'apply')).rejects.toThrow('more than 20');expect(m.mutations).toEqual([]);
  });
  it('requires an existing admin without creating any users',async()=>{
    const m=mockDatabase();m.tx.user.findFirst.mockResolvedValue(null);
    await expect(replaceDummyBank(m.db,approvedFixture(),'apply')).rejects.toThrow('administrator');expect(m.mutations).toEqual([]);
  });
});
