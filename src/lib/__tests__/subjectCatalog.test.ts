import { describe, it, expect } from "vitest";
import { SUBJECT_CATALOG, SUBJECT_NAMES } from "../subjectCatalog";
import { SUBJECT_TOPICS, SUBJECT_SLUGS } from "../subjectTopics";
import { topicsInGrade } from "../catalogGrades";
import { extractCriteria } from "../chatbot/recommend";

describe("approved general-subject catalog", () => {
  it("uses the ten approved general subjects without separate TLE or TVL dropdowns", () => {
    expect(Object.values(SUBJECT_NAMES)).toEqual([
      "Mathematics", "Science", "English", "Filipino", "Araling Panlipunan / Social Studies",
      "Values & Personal Development", "Arts, Physical Education & Health", "Business & Entrepreneurship",
      "Research & Digital Literacy", "Miscellaneous",
    ]);
    expect(SUBJECT_SLUGS).not.toContain("TLE");
    expect(SUBJECT_SLUGS.some((s) => s.startsWith("SHS_"))).toBe(false);
    expect(SUBJECT_CATALOG.reduce((n, s) => n + s.topics.length, 0)).toBe(135);
  });
  it("places practical skills under Miscellaneous and academic specialisms under their general groups", () => {
    expect(SUBJECT_TOPICS.MISCELLANEOUS).toEqual(expect.arrayContaining(["Cooking & Food Preparation", "Baking & Pastry", "Computer Systems Servicing", "Welding"]));
    expect(SUBJECT_TOPICS.MATH).toContain("Limits & Derivatives");
    expect(SUBJECT_TOPICS.RESEARCH_DIGITAL_LITERACY).toContain("Qualitative Research");
    expect(SUBJECT_TOPICS.BUSINESS_ENTREPRENEURSHIP).toContain("Entrepreneurship");
    expect(SUBJECT_TOPICS.MISCELLANEOUS).not.toContain("Entrepreneurship");
  });
  it("keeps every topic valid for existing forms and its assigned parent grades", () => {
    for (const s of SUBJECT_CATALOG) {
      expect(new Set(s.topics.map((t) => t.name)).size).toBe(s.topics.length);
      for (const t of s.topics) {
        expect(t.name.length).toBeLessThanOrEqual(60);
        expect(t.gradeLevels.length).toBeGreaterThan(0);
        expect(t.gradeLevels.every((g) => s.gradeLevels.includes(g))).toBe(true);
      }
    }
  });
  it("filters specific skills by their own grade coverage", () => {
    const s = SUBJECT_CATALOG.find((s) => s.slug === "MISCELLANEOUS")!;
    const catalog = { ...s, topics: s.topics.map((t) => t.name), topicGrades: Object.fromEntries(s.topics.map((t) => [t.name, t.gradeLevels])) };
    expect(topicsInGrade(catalog, "GRADE_7")).toContain("Cooking & Food Preparation");
    expect(topicsInGrade(catalog, "GRADE_7")).not.toContain("Server Administration");
    expect(topicsInGrade(catalog, "GRADE_12")).toContain("Server Administration");
  });
  it("routes skill requests to Miscellaneous rather than a removed TLE subject", () => {
    expect(extractCriteria("I need help with cooking").subject).toBe("MISCELLANEOUS");
    expect(extractCriteria("help with welding").subject).toBe("MISCELLANEOUS");
    expect(extractCriteria("entrepreneurship and business planning").subject).toBe("BUSINESS_ENTREPRENEURSHIP");
    expect(extractCriteria("qualitative research").subject).toBe("RESEARCH_DIGITAL_LITERACY");
  });
});
