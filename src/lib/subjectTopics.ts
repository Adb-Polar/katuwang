

export const SUBJECT_TOPICS: Record<string, string[]> = {
  MATH: [
    "Whole Numbers & Operations",
    "Fractions & Decimals",
    "Algebraic Expressions",
    "Linear Equations & Inequalities",
    "Geometry & Measurement",
    "Statistics & Probability",
    "Trigonometry",
    "Functions & Graphing",
  ],
  ENGLISH: [
    "Grammar & Sentence Structure",
    "Reading Comprehension",
    "Vocabulary Building",
    "Essay & Paragraph Writing",
    "Literature Analysis",
    "Public Speaking & Oral Communication",
    "Research Writing",
  ],
  SCIENCE: [
    "Scientific Method & Inquiry",
    "Cell Biology & Genetics",
    "Chemical Reactions & Matter",
    "Force, Motion & Energy",
    "Ecosystems & the Environment",
    "Earth & Space Science",
    "Human Body Systems",
  ],
  FILIPINO: [
    "Balarila (Gramatika)",
    "Pagbasa at Pag-unawa",
    "Panitikang Pilipino",
    "Pagsulat ng Sanaysay",
    "Pagsasalin",
    "Retorika at Pampublikong Pagsasalita",
  ],
  ARALING_PANLIPUNAN: [
    "Kasaysayan ng Pilipinas",
    "Heograpiya",
    "Ekonomiks",
    "Sibika at Pamahalaan",
    "Kultura at Lipunan",
    "Kasalukuyang Pangyayari (Current Events)",
  ],
  TLE: [
    "Computer Basics & ICT",
    "Home Economics",
    "Agri-Fishery Arts",
    "Industrial Arts",
    "Entrepreneurship",
  ],
  MAPEH: [
    "Music Theory & Appreciation",
    "Visual Arts",
    "Physical Education & Sports",
    "Health Education",
  ],
};

/** Subject slugs in catalogue order — the single derived list, no re-casting at call sites. */
export const SUBJECT_SLUGS: string[] = Object.keys(SUBJECT_TOPICS);

/**
 * Normalizes a user-typed topic: trims and collapses internal whitespace.
 * Custom topics are stored verbatim (after this pass), so keep it conservative.
 */
export function normalizeTopic(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** True when `topic` is one of the curated topics for `subject` (case-insensitive). */
export function isKnownTopic(subject: string, topic: string): boolean {
  const t = normalizeTopic(topic).toLowerCase();
  return (SUBJECT_TOPICS[subject] ?? []).some((k) => k.toLowerCase() === t);
}
