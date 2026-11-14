import { createHash } from "node:crypto";
import { SUBJECT_CATALOG } from "../src/lib/subjectCatalog";
import { loadQuestionBank } from "./questionBankData";

export const REBUILD_REVISION = "curriculum-connected-seed-2026-11-14-v1";
export const DEMO_TAG = "[CURRICULUM DEMO]";
export const seedId = (kind: string, key: string) => "c" + createHash("sha256").update(`${REBUILD_REVISION}\0${kind}\0${key}`).digest("hex").slice(0, 24);
const NAMED_SEED_EMAILS = new Set([
  "maria.santos", "jose.reyes", "ana.cruz", "paolo.garcia", "liza.fernandez",
  "juan.delacruz", "carla.mendoza", "miguel.torres", "angela.ramos", "kevin.bautista", "sofia.villanueva",
  "pending.learner", "pending.tutor", "suspended.tutor", "banned.user", "declined.applicant",
].map(name => `${name}@katuwang.test`).concat(["demo@tutor.test", "demo@learner.test"]));

/** Exact historical seed identities; an arbitrary .test account is not seed data. */
export function isSeedEmail(email: string) {
  return NAMED_SEED_EMAILS.has(email) || /^gen\.(tutor|learner)\.\d{3,}@seed\.katuwang\.test$/.test(email)
    || /^curriculum\.(tutor|learner)\.grade-(7|8|9|10|11|12)@seed\.katuwang\.test$/.test(email);
}

/** Every subject/topic/grade association is generated from the current catalog. */
export function curriculumDemoRecipe() {
  const bank = loadQuestionBank();
  const questions = new Map<string, typeof bank.questions>();
  for (const q of bank.questions) {
    const key = JSON.stringify([q.subject, q.topic]);
    questions.set(key, [...(questions.get(key) ?? []), q]);
  }
  return SUBJECT_CATALOG.flatMap(subject => subject.topics.flatMap(topic => topic.gradeLevels.map(gradeLevel => {
    const pool = questions.get(JSON.stringify([subject.slug, topic.name]));
    if (pool?.length !== 20 || !subject.gradeLevels.includes(gradeLevel)) throw Error("Incomplete canonical seed recipe");
    const key = JSON.stringify([subject.slug, topic.name, gradeLevel]);
    return { key, subject: subject.slug, subjectName: subject.name, topic: topic.name, gradeLevel,
      classId: seedId("class", key), requestId: seedId("request", key), questions: pool };
  })));
}
