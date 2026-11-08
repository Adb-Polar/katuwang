import { createHash } from 'node:crypto';
import { z } from 'zod';

export const topicSchema = z.object({
  subject: z.string().min(1), subjectName: z.string().min(1),
  subjectId: z.string().nullable(), topic: z.string().min(1), topicId: z.string().nullable(),
  educationalLevel: z.string().nullable(), existingActiveBankCount: z.number().int().nonnegative().nullable(),
});
export type InventoryTopic = z.infer<typeof topicSchema>;
const questionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/), subject: z.string().min(1), topic: z.string().min(1),
  prompt: z.string().trim().min(5).max(1000), explanation: z.string().trim().min(1).max(1000),
  options: z.array(z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean() })).length(4),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cognitiveSkill: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate']),
  learningObjective: z.string().trim().min(5), educationalLevel: z.string().trim().min(1),
  sourceIds: z.array(z.string().min(1)).min(1), researchDate: z.iso.date(),
  verificationStatus: z.enum(['researched', 'needs-review', 'academically-approved']),
  // Qualitative and mathematical verification is a human responsibility.
  review: z.object({ reviewer: z.string().trim().min(1), date: z.iso.date(),
    accuracy: z.boolean(), relevance: z.boolean(), level: z.boolean(),
    distractors: z.boolean(), originality: z.boolean(), calculations: z.boolean(),
  }).optional(),
});
export const bankSchema = z.object({
  version: z.literal(1), bankId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  sources: z.array(z.object({
    id: z.string().min(1), url: z.url().refine(s => /^https?:\/\//.test(s)),
    title: z.string().trim().min(1), publisher: z.string().trim().min(1),
    accessedDate: z.iso.date(), evidenceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    // Local research evidence record: source retrieval hashes and original notes.
    evidenceFile: z.string().min(1), notes: z.string().trim().min(1),
  })),
  questions: z.array(questionSchema),
});
export type Bank = z.infer<typeof bankSchema>;
export type Issue = { code: string; questionIds?: string[]; topic?: string; message: string };
export function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function normalize(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}
const key = (subject: string, topic: string) => JSON.stringify([subject, topic]);
// Preserve digits and operators: 2+3 and 2-3 must not become identical.
function tokens(s: string): Set<string> {
  return new Set(normalize(s).match(/[\p{L}\p{N}]+|[+−\-*/÷×=<>^]/gu) ?? []);
}
function similarity(a: string, b: string): number {
  const x = tokens(a), y = tokens(b);
  const intersection = [...x].filter(t => y.has(t)).length;
  return intersection / (x.size + y.size - intersection || 1);
}
export function validateBank(input: unknown, inventoryInput: unknown) {
  const inventory = z.array(topicSchema).min(1).parse(inventoryInput);
  const parsed = bankSchema.safeParse(input);
  const errors: Issue[] = [], reviewFlags: Issue[] = [];
  if (!parsed.success) {
    return { valid: false, productionReady: false, questionCount: 0,
      structurallyPassingQuestions: 0, requiringManualReview: 0,
      errors: parsed.error.issues.map(e => ({ code: 'SCHEMA', message: `${e.path.join('.')}: ${e.message}` })), reviewFlags, topics: [] };
  }
  const bank = parsed.data;
  const known = new Set(inventory.map(t => key(t.subject, t.topic)));
  if (known.size !== inventory.length) errors.push({code:'INVENTORY_DUPLICATE', message:'Repeated subject/topic in inventory.'});
  const ids = new Set<string>(), sources = new Map(bank.sources.map(s => [s.id, s]));
  if (sources.size !== bank.sources.length) errors.push({code:'SOURCE_DUPLICATE', message:'Repeated source identifier.'});
  const groups = new Map<string, Bank['questions']>();
  const prompts = new Map<string, string>();
  const bad = new Set<string>(), needsReview = new Set<string>();
  const fail = (q: Bank['questions'][number], code: string, message: string) => {
    bad.add(q.id); errors.push({code, questionIds:[q.id], message});
  };
  for (const q of bank.questions) {
    if (ids.has(q.id)) fail(q, 'DUPLICATE_ID', 'Question identifier is repeated.');
    ids.add(q.id);
    const k = key(q.subject, q.topic);
    if (!known.has(k)) fail(q, 'UNKNOWN_TOPIC', 'Question does not match an inventoried subject/topic.');
    groups.set(k, [...(groups.get(k) ?? []), q]);
    if (q.options.filter(o => o.isCorrect).length !== 1) fail(q, 'ANSWER_KEY', 'Exactly one correct option is required.');
    if (new Set(q.options.map(o => normalize(o.text))).size !== 4) fail(q, 'DUPLICATE_OPTION', 'Option texts must be distinct.');
    const prompt = normalize(q.prompt);
    const existing = prompts.get(prompt);
    if (existing) { bad.add(existing); fail(q, 'EXACT_DUPLICATE', `Same prompt as ${existing}.`); }
    prompts.set(prompt, q.id);
    if (/placeholder|demo question|practice item|lorem ipsum|\bTODO\b/i.test(`${q.prompt} ${q.explanation}`)) fail(q, 'PLACEHOLDER', 'Placeholder text detected.');
    if (/\\frac\s*\{|\$\$|\\\(|\\\[/.test(q.prompt)) {
      needsReview.add(q.id); reviewFlags.push({code:'MATH_RENDERING',questionIds:[q.id], message:'Confirm mathematical notation renders in the existing plain-text interface.'});
    }
    for (const sourceId of q.sourceIds) {
      const source = sources.get(sourceId);
      if (!source) fail(q, 'SOURCE_MISSING', `Unknown source ${sourceId}.`);
      else if (source.accessedDate > q.researchDate) fail(q, 'SOURCE_DATE', 'Source access cannot follow question research date.');
    }
    if (q.researchDate > new Date().toISOString().slice(0,10)) fail(q, 'FUTURE_DATE', 'Research date is in the future.');
    const approved = q.verificationStatus === 'academically-approved' && q.review &&
      Object.entries(q.review).every(([field, value]) => ['reviewer','date'].includes(field) || value === true) &&
      q.review.date >= q.researchDate && q.review.date <= new Date().toISOString().slice(0,10);
    if (!approved) needsReview.add(q.id);
  }
  const topics = inventory.map(t => {
    const rows = groups.get(key(t.subject,t.topic)) ?? [];
    const counts = {easy:0, medium:0, hard:0};
    rows.forEach(q => counts[q.difficulty]++);
    if (rows.length !== 20 || counts.easy !== 6 || counts.medium !== 10 || counts.hard !== 4) {
      rows.forEach(q => bad.add(q.id));
      errors.push({code:'TOPIC_DISTRIBUTION', topic:key(t.subject,t.topic), message:`Expected 20 (6/10/4); got ${rows.length} (${counts.easy}/${counts.medium}/${counts.hard}).`});
    }
    for (let i=0;i<rows.length;i++) for (let j=i+1;j<rows.length;j++) {
      if (normalize(rows[i].prompt) !== normalize(rows[j].prompt) && similarity(rows[i].prompt,rows[j].prompt) >= 0.82) {
        const questionIds = [rows[i].id,rows[j].id];
        questionIds.forEach(id => needsReview.add(id));
        reviewFlags.push({code:'NEAR_DUPLICATE', questionIds, message:'High token overlap; require human comparison and revision before release.'});
      }
    }
    return {...t, targetCount:20, newCount:rows.length, ...counts,
      sourceUrls:[...new Set(rows.flatMap(q => q.sourceIds.map(id => sources.get(id)?.url).filter(Boolean)))],
      reviewStatus: rows.length === 20 && rows.every(q => !needsReview.has(q.id)) ? 'reviewed' : 'incomplete-or-pending',
    };
  });
  return { valid:errors.length===0, productionReady:errors.length===0 && needsReview.size===0 && reviewFlags.length===0,
    questionCount:bank.questions.length, structurallyPassingQuestions:bank.questions.filter(q => !bad.has(q.id)).length,
    requiringManualReview:needsReview.size, errors, reviewFlags, topics };
}
