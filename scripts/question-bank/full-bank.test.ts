import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { inspectQuestionSeed } from '../../prisma/seed-question-bank';
import { validateBank } from './validate';
const bank=JSON.parse(readFileSync('prisma/question-bank/questions.json','utf8'));
import { SUBJECT_TOPICS } from '../../src/lib/subjectTopics';
const inventory=Object.entries(SUBJECT_TOPICS).flatMap(([subject,topics])=>topics.map(topic=>({subject,subjectName:subject,topic,subjectId:null,topicId:null,educationalLevel:null,existingActiveBankCount:null})));

describe('complete authored bank seed',()=>{
  it('covers the current 135-topic catalogue exactly twenty times with 6/10/4 difficulty',()=>{
    const r=validateBank(bank,inventory);
    expect(r.errors).toEqual([]);expect(r.reviewFlags).toEqual([]);
    expect(r.questionCount).toBe(2700);expect(r.topics).toHaveLength(135);
    expect(r.topics.every(t=>t.newCount===20 && t.easy===6 && t.medium===10 && t.hard===4)).toBe(true);
  });
  it('keeps A/B/C/D answer positions balanced separately in every topic',()=>{
    for(const t of inventory){
      const q=bank.questions.filter((q:{subject:string;topic:string})=>q.subject===t.subject && q.topic===t.topic);
      const positions=q.map((q:{options:{isCorrect:boolean}[]})=>q.options.findIndex(o=>o.isCorrect));
      expect([0,1,2,3].map(i=>positions.filter((p:number)=>p===i).length)).toEqual([5,5,5,5]);
    }
  });
  it('validates the shipped bank and evidence without database access',async()=>{
    const {validation}=await inspectQuestionSeed();
    expect(validation.valid).toBe(true);expect(validation.topics).toHaveLength(135);
  });
  it('reports actual human review status instead of approving its own content',()=>{
    const r=validateBank(bank,inventory);expect(r.requiringManualReview).toBe(2700);expect(r.productionReady).toBe(false);
  });
});
