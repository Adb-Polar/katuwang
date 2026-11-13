import type { Bank, InventoryTopic } from './validate';

/** Exact keys only: names are never silently mapped onto a different topic. */
export function bankCoverage(bank: Bank, inventory: InventoryTopic[]) {
  const key = (subject:string, topic:string) => JSON.stringify([subject,topic]);
  const counts = new Map<string,number>();
  for (const q of bank.questions) counts.set(key(q.subject,q.topic),(counts.get(key(q.subject,q.topic)) ?? 0)+1);
  const known = new Set(inventory.map(t => key(t.subject,t.topic)));
  const missing = inventory.filter(t => !counts.has(key(t.subject,t.topic))).map(({subject,topic}) => ({subject,topic}));
  const unmatched = [...counts].filter(([k]) => !known.has(k)).map(([k,count]) => {
    const [subject,topic] = JSON.parse(k) as [string,string];return {subject,topic,count};
  });
  return {catalogueTopics:inventory.length,requiredQuestions:inventory.length*20,
    fileQuestions:bank.questions.length,fileTopics:counts.size,missing,unmatched};
}

export function coverageFailureMessage(coverage:ReturnType<typeof bankCoverage>) {
  const lines = [
    'Question bank does not match the current catalogue.',
    `Catalogue: ${coverage.catalogueTopics} topics; ${coverage.requiredQuestions} questions required (20 each: 6 easy / 10 medium / 4 hard).`,
    `File: ${coverage.fileQuestions} questions across ${coverage.fileTopics} topic keys.`,
    `Missing topics: ${coverage.missing.length}. Unmatched file topics: ${coverage.unmatched.length}.`,
  ];
  if (coverage.missing.length) {
    lines.push('Missing examples:',...coverage.missing.slice(0,6).map(t => `  ${t.subject} / ${t.topic}`));
    if (coverage.missing.length>6) lines.push(`  ...and ${coverage.missing.length-6} more.`);
  }
  lines.push('Update questions.json to the current catalogue; do not rerun the same incomplete file or bypass coverage validation. No database writes were attempted.');
  return lines.join('\n');
}
