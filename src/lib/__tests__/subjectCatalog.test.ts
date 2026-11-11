vi.mock("@/lib/subjects", () => ({ getSubjects: async () => (await import("@/test/catalogFixture")).verifiedCatalogFixture() }));
import { describe, it, expect, vi } from "vitest";
import { SUBJECT_CATALOG, SUBJECT_NAMES } from "../subjectCatalog";
import { SUBJECT_TOPICS } from "../subjectTopics";
import { topicsInGrade } from "../catalogGrades";
import { validateCurriculumCatalog } from "../validateCurriculumCatalog";
import receipts from "../../../prisma/data/curriculum/source-verification-2026-11-11.json";
import { extractCriteria } from "../chatbot/recommend";

describe("DepEd source-backed curriculum catalog", () => {
  it("keeps learning areas and SHS courses separate, with evidence for every grade", () => {
    validateCurriculumCatalog(SUBJECT_CATALOG);
    expect(SUBJECT_CATALOG).toHaveLength(47);
    expect(SUBJECT_CATALOG.reduce((n,s) => n+s.topics.length,0)).toBe(292);
    expect(SUBJECT_CATALOG.reduce((n,s) => n+s.topics.reduce((m,t) => m+t.gradeLevels.length,0),0)).toBe(408);
    expect(Object.values(SUBJECT_NAMES)).toEqual(expect.arrayContaining(["Arts","Music","Health","Physical Education","General Mathematics","Bakery Operations"]));
    expect(SUBJECT_NAMES.MISCELLANEOUS).toBeUndefined();
    const checked = new Set(receipts.receipts.map(r => r.url));
    for (const subject of SUBJECT_CATALOG) for (const topic of subject.topics) {
      expect(topic.name).not.toBe("Curriculum Guide");
      for (const a of topic.curriculum.associations) {
        expect(checked.has(a.gradeEvidenceUrl), a.gradeEvidenceUrl).toBe(true);
        if (topic.curriculum.status === "verified-guide") {
          const receipt = receipts.receipts.find(r => r.url === a.sourceUrl);
          expect(receipt?.topicEvidence).toContainEqual({ topic: topic.name, pdfPage: a.pdfPage });
        } else {
          const index = receipts.receipts.find(r => r.url === a.gradeEvidenceUrl);
          expect(index?.domainLinks?.some(link => link.url === a.sourceUrl), `${subject.slug}/${topic.name}/${a.gradeLevel}`).toBe(true);
        }
      }
    }
  });
  it("rejects duplicates, invented grades, unverified hosts and missing SHS track evidence", () => {
    const data = structuredClone(SUBJECT_CATALOG);
    data[0].topics.push(data[0].topics[0]);
    expect(() => validateCurriculumCatalog(data)).toThrow(/Duplicate/);
    const missingGrade = structuredClone(SUBJECT_CATALOG);
    missingGrade[0].topics[0].curriculum.associations = [];
    expect(() => validateCurriculumCatalog(missingGrade)).toThrow();
    const invalid = structuredClone(SUBJECT_CATALOG);
    invalid[0].curriculum.sources[0].url = "https://deped.gov.ph.example.com/fake";
    expect(() => validateCurriculumCatalog(invalid)).toThrow(/official DepEd/);
    const shs = structuredClone(SUBJECT_CATALOG);
    const entry = shs.find(s => s.slug === "SSHS_GENERAL_MATHEMATICS")!;
    entry.topics[0].curriculum.associations[0].track = null;
    expect(() => validateCurriculumCatalog(shs)).toThrow(/track evidence/);
  });
  it("retains multiple grade associations and never infers SHS from a junior-high topic", () => {
    const s = SUBJECT_CATALOG.find(s => s.slug === "MATH")!;
    const row = { ...s, topics:s.topics.map(t => t.name), topicGrades:Object.fromEntries(s.topics.map(t => [t.name,t.gradeLevels])) };
    expect(topicsInGrade(row,"GRADE_7")).toContain("Patterns and Algebra");
    expect(topicsInGrade(row,"GRADE_10")).toContain("Patterns and Algebra");
    expect(topicsInGrade(row,"GRADE_11")).toEqual([]);
    expect(SUBJECT_TOPICS.SSHS_BASIC_CALCULUS).toContain("Limits and Continuity");
  });
  it("matches chatbot subjects from the live course names", async () => {
    expect((await extractCriteria("help with bakery operations")).subject).toBe("SSHS_BAKERY_OPERATIONS");
    expect((await extractCriteria("general mathematics")).subject).toBe("SSHS_GENERAL_MATHEMATICS");
  });
});
