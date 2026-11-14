import { readFileSync } from "node:fs";
import { join } from "node:path";

type ArchivedQuestion = {
  id: string; subject: string; topic: string; prompt: string; explanation?: string | null;
  options: { text: string; isCorrect: boolean }[];
};
let cached: Map<string, ArchivedQuestion> | undefined;

/** The previous 2,700-question authored seed is retained as provenance only. */
export function archivedSeedQuestions() {
  if (!cached) {
    const document = JSON.parse(readFileSync(join(__dirname, "question-bank/questions.json"), "utf8"));
    if (!Array.isArray(document.questions)) throw Error("Archived seed provenance is unavailable");
    cached = new Map((document.questions as ArchivedQuestion[]).map(q => [q.id, q]));
  }
  return cached;
}

/** An independently edited/reviewed old item is preserved even if its ID matches. */
export function matchesArchivedSeedQuestion(question: ArchivedQuestion & { reviewStatus: string }) {
  const source = archivedSeedQuestions().get(question.id);
  return Boolean(source && question.reviewStatus !== "APPROVED" && question.subject === source.subject && question.topic === source.topic
    && question.prompt === source.prompt && (question.explanation ?? null) === (source.explanation ?? null)
    && JSON.stringify(question.options.map(o => [o.text, o.isCorrect])) === JSON.stringify(source.options.map(o => [o.text, o.isCorrect])));
}
