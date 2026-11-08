import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateBank, normalize } from './validate';
const bank = JSON.parse(readFileSync('scripts/question-bank/fixtures/pilot-bank.json','utf8'));
const inventory = JSON.parse(readFileSync('scripts/question-bank/fixtures/seed-inventory.json','utf8')).inventory;
const oneTopic = inventory.filter((t:{topic:string}) => t.topic==='Whole Numbers & Operations');
const copy = () => structuredClone(bank);
describe('replacement question bank safety gates', () => {
  it('rejects a partial bank against the complete catalogue', () => {
    const r=validateBank(bank,inventory);
    expect(r.valid).toBe(false); expect(r.errors.filter(e => e.code==='TOPIC_DISTRIBUTION')).toHaveLength(42);
    expect(r.productionReady).toBe(false);
  });
  it('accepts the draft structure while requiring all twenty academic reviews', () => {
    const r=validateBank(bank,oneTopic);
    expect(r.errors).toEqual([]); expect(r.reviewFlags).toEqual([]); expect(r.valid).toBe(true);
    expect(r.requiringManualReview).toBe(20); expect(r.productionReady).toBe(false);
  });
  it('rejects missing and multiple correct answers', () => {
    for (const n of [0,2]) { const b=copy(); b.questions[0].options.forEach((o:{isCorrect:boolean},i:number)=>o.isCorrect=i<n);
      expect(validateBank(b,oneTopic).errors.some(e=>e.code==='ANSWER_KEY')).toBe(true); }
  });
  it('rejects missing topics, unknown topics and difficulty drift', () => {
    const b=copy(); b.questions[0].topic='Invented topic'; b.questions[1].difficulty='hard';
    const codes=validateBank(b,oneTopic).errors.map(e=>e.code);
    expect(codes).toContain('UNKNOWN_TOPIC'); expect(codes).toContain('TOPIC_DISTRIBUTION');
  });
  it('rejects duplicated prompts even across topics and repeated choices', () => {
    const b=copy(); b.questions[1].prompt=b.questions[0].prompt;
    b.questions[2].options[0].text=b.questions[2].options[1].text;
    const codes=validateBank(b,oneTopic).errors.map(e=>e.code);
    expect(codes).toContain('EXACT_DUPLICATE');expect(codes).toContain('DUPLICATE_OPTION');
  });
  it('flags number-substitution variants for review', () => {
    const b=copy(); b.questions[1].prompt='A school receives 8 packs of 25 pencils and gives out 37 pencils. How many of the received pencils remain?';
    expect(validateBank(b,oneTopic).reviewFlags.some(e=>e.code==='NEAR_DUPLICATE')).toBe(true);
  });
  it('requires retrievable source identifiers and credible date ordering', () => {
    const b=copy(); b.questions[0].sourceIds=['imaginary']; b.sources[1].accessedDate='2099-01-01';
    const codes=validateBank(b,oneTopic).errors.map(e=>e.code);
    expect(codes).toContain('SOURCE_MISSING');expect(codes).toContain('SOURCE_DATE');
  });
  it('does not accept a status label as academic approval', () => {
    const b=copy(); b.questions.forEach((q:{verificationStatus:string})=>q.verificationStatus='academically-approved');
    expect(validateBank(b,oneTopic).productionReady).toBe(false);
  });
  it('rejects malformed and empty schema data without throwing', () => {
    expect(validateBank({},oneTopic).valid).toBe(false);
    const b=copy();b.questions[0].options.pop();expect(validateBank(b,oneTopic).valid).toBe(false);
  });
  it('normalizes whitespace without erasing significant operators', () => {
    expect(normalize('  A   B  ')).toBe('a b');expect(normalize('2+3')).not.toBe(normalize('2-3'));
  });
});
