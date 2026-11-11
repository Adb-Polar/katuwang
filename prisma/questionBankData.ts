import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";

export interface BankQuestion {
  id: string;
  subject: string;
  topic: string;
  gradeLevels: string[];
  number: number;
  language: "en" | "fil";
  kind: "concept" | "calculation";
  contentRef: string;
  prompt: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
}
export interface QuestionBank {
  schemaVersion: 1;
  revision: string;
  authorship: string;
  reviewStatus: "UNREVIEWED";
  questionsPerTopic: 20;
  questions: BankQuestion[];
}
export function questionId(subject: string, topic: string, contentRef: string) {
  return "c" + createHash("sha256").update(`${subject}\0${topic}\0${contentRef}`).digest("hex").slice(0, 24);
}
const keyOf = (subject: string, topic: string) => JSON.stringify([subject, topic]);
const nonempty = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Validate the complete committed dataset before any database work. */
export function validateQuestionBank(input: unknown): QuestionBank {
  if (!input || typeof input !== "object") throw Error("Invalid question bank document");
  const bank = input as QuestionBank;
  if (bank.schemaVersion !== 1 || bank.questionsPerTopic !== 20 || bank.reviewStatus !== "UNREVIEWED" || !nonempty(bank.revision, 100) || !nonempty(bank.authorship, 1000) || !Array.isArray(bank.questions)) throw Error("Invalid question bank metadata");
  const topics = new Map(SUBJECT_CATALOG.flatMap(s => s.topics.map(t => [keyOf(s.slug, t.name), t.gradeLevels] as const)));
  const groups = new Map<string, BankQuestion[]>();
  const ids = new Set<string>();
  for (const q of bank.questions) {
    if (!q || typeof q !== "object") throw Error("Invalid question entry");
    const key = keyOf(q.subject, q.topic);
    const grades = topics.get(key);
    if (!grades || JSON.stringify(q.gradeLevels) !== JSON.stringify(grades)) throw Error(`Unknown topic or incorrect grades: ${key}`);
    if (!nonempty(q.contentRef, 150) || q.id !== questionId(q.subject, q.topic, q.contentRef) || ids.has(q.id)) throw Error(`Invalid or duplicate question ID: ${q.id}`);
    ids.add(q.id);
    if (!nonempty(q.prompt, 1000) || q.prompt.trim().length < 5 || !nonempty(q.explanation, 1000)) throw Error(`Missing prompt or explanation: ${q.id}`);
    if (!["en", "fil"].includes(q.language) || !["concept", "calculation"].includes(q.kind) || !Number.isInteger(q.number) || q.number < 1 || q.number > 20) throw Error(`Invalid question metadata: ${q.id}`);
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => !o || !nonempty(o.text, 500) || typeof o.isCorrect !== "boolean") || q.options.filter(o => o.isCorrect).length !== 1 || new Set(q.options.map(o => o.text.trim().toLowerCase())).size !== 4) throw Error(`Invalid options: ${q.id}`);
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }
  for (const key of topics.keys()) {
    const qs = groups.get(key) ?? [];
    if (qs.length !== 20 || new Set(qs.map(q => q.number)).size !== 20 || new Set(qs.map(q => q.prompt.trim().toLowerCase())).size !== 20) throw Error(`Expected 20 distinct questions: ${key}`);
    for (let position = 0; position < 4; position++) if (qs.filter(q => q.options[position].isCorrect).length !== 5) throw Error(`Unbalanced answer positions: ${key}`);
  }
  if (bank.questions.length !== topics.size * 20) throw Error("Unexpected total question count");
  return bank;
}
export function loadQuestionBank(): QuestionBank {
  return validateQuestionBank(JSON.parse(readFileSync(join(__dirname, "data/questions/question-bank.json"), "utf8")));
}
