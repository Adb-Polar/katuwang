import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import legacyCatalog from '../../src/lib/approvedSubjectCatalog.json';
import { bankCoverage, coverageFailureMessage } from './coverage';
import { bankSchema } from './validate';
const bank=bankSchema.parse(JSON.parse(readFileSync('prisma/question-bank/questions.json','utf8')));
const inventory=legacyCatalog.flatMap(({slug:subject,topics})=>topics.map(({name:topic})=>({subject,subjectName:subject,topic,subjectId:null,topicId:null,educationalLevel:null,existingActiveBankCount:null})));
describe('actionable catalogue mismatch diagnostics',()=>{
  it('matches every archived topic without renamed or unmatched keys',()=>{
    const c=bankCoverage(bank,inventory);
    expect(c.catalogueTopics).toBe(135);expect(c.requiredQuestions).toBe(2700);
    expect(c.fileQuestions).toBe(2700);expect(c.missing).toEqual([]);expect(c.unmatched).toEqual([]);
  });
  it('distinguishes absent topics from obsolete file keys',()=>{
    const partial=structuredClone(bank);partial.questions=partial.questions.slice(0,20);
    partial.questions[0].topic='Obsolete topic';
    const c=bankCoverage(partial,inventory);
    expect(c.missing).toHaveLength(134);expect(c.unmatched).toEqual([{subject:partial.questions[0].subject,topic:'Obsolete topic',count:1}]);
    const message=coverageFailureMessage(c);
    expect(message).toContain('2700 questions required');expect(message).toContain('No database writes');
    expect(message.split('\n').length).toBeLessThan(16);
  });
});
