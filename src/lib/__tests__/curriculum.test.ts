import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { GradeLevel } from "@prisma/client";
import { scoreClass, rankMatches, ClassForMatching, MatchCriteria } from "@/lib/matching";

interface CurriculumRecord {
  subjectSlug: string;
  subjectName: string;
  gradeLevel: GradeLevel;
  quarterOrTerm: string;
  unitOrContentDomain: string;
  topic: string;
  subtopic: string;
  learningCompetency: string;
  competencyCode: string;
  curriculumVersion: string;
  trackOrStrand: string;
  sourceTitle: string;
  sourceUrl: string;
  pageNumber: string;
  verificationStatus: string;
}

const datasetPath = path.resolve(__dirname, "../../../prisma/data/curriculum/curriculum_dataset.json");

describe("Curriculum Dataset Integrity & Source Verification", () => {
  it("loads the curriculum dataset successfully", () => {
    expect(fs.existsSync(datasetPath)).toBe(true);
    const raw = fs.readFileSync(datasetPath, "utf-8");
    const records: CurriculumRecord[] = JSON.parse(raw);
    expect(records.length).toBeGreaterThanOrEqual(100);
  });

  it("validates that all records contain required non-empty fields", () => {
    const records: CurriculumRecord[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
    for (const r of records) {
      expect(r.subjectSlug).toBeTruthy();
      expect(r.subjectName).toBeTruthy();
      expect(r.gradeLevel).toMatch(/^GRADE_(7|8|9|10|11|12)$/);
      expect(r.topic).toBeTruthy();
      expect(r.learningCompetency).toBeTruthy();
      expect(r.curriculumVersion).toBeTruthy();
      expect(r.trackOrStrand).toBeTruthy();
      expect(r.sourceTitle).toBeTruthy();
      expect(r.sourceUrl).toMatch(/^https?:\/\//);
      expect(r.verificationStatus).toMatch(/^(VERIFIED|TRANSITIONAL)$/);
    }
  });

  it("verifies official DepEd provenance for all source URLs", () => {
    const records: CurriculumRecord[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
    for (const r of records) {
      expect(r.sourceUrl).toContain("deped.gov.ph");
    }
  });

  it("contains no duplicate competency records on (subjectSlug, topic, competencyCode)", () => {
    const records: CurriculumRecord[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
    const keys = new Set<string>();
    for (const r of records) {
      const key = `${r.subjectSlug}::${r.topic}::${r.competencyCode}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });
});

describe("Curriculum Coverage & Grade-Level Mapping", () => {
  const records: CurriculumRecord[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

  it("covers all 6 secondary grade levels (Grade 7 to 12)", () => {
    const grades = new Set(records.map((r) => r.gradeLevel));
    expect(grades.has(GradeLevel.GRADE_7)).toBe(true);
    expect(grades.has(GradeLevel.GRADE_8)).toBe(true);
    expect(grades.has(GradeLevel.GRADE_9)).toBe(true);
    expect(grades.has(GradeLevel.GRADE_10)).toBe(true);
    expect(grades.has(GradeLevel.GRADE_11)).toBe(true);
    expect(grades.has(GradeLevel.GRADE_12)).toBe(true);
  });

  it("ensures JHS subjects strictly map to Grades 7-10", () => {
    const jhsRecords = records.filter((r) => r.trackOrStrand === "JHS");
    expect(jhsRecords.length).toBeGreaterThanOrEqual(50);
    for (const r of jhsRecords) {
      expect(["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10"]).toContain(r.gradeLevel);
    }
  });

  it("ensures SHS subjects strictly map to Grades 11-12", () => {
    const shsRecords = records.filter((r) => r.trackOrStrand !== "JHS");
    expect(shsRecords.length).toBeGreaterThanOrEqual(40);
    for (const r of shsRecords) {
      expect(["GRADE_11", "GRADE_12"]).toContain(r.gradeLevel);
    }
  });

  it("covers core, applied, academic, and TVL tracks in Senior High School", () => {
    const tracks = new Set(records.map((r) => r.trackOrStrand));
    expect(tracks.has("SHS_CORE")).toBe(true);
    expect(tracks.has("SHS_APPLIED")).toBe(true);
    expect(tracks.has("ACADEMIC_STEM")).toBe(true);
    expect(tracks.has("ACADEMIC_ABM")).toBe(true);
    expect(tracks.has("ACADEMIC_HUMSS")).toBe(true);
    expect(tracks.has("TVL_ICT")).toBe(true);
    expect(tracks.has("TVL_HE")).toBe(true);
    expect(tracks.has("TVL_IA")).toBe(true);
  });
});

describe("Curriculum-Based Tutor & Learner Matching", () => {
  const NOW = new Date("2026-10-19T08:00:00Z");

  function mkClass(overrides: Partial<ClassForMatching> = {}): ClassForMatching {
    return {
      id: "class-1",
      subject: "SHS_GENMATH",
      gradeLevel: GradeLevel.GRADE_11,
      topics: ["Functions & Rational Functions"],
      verifiedTopics: [],
      sessions: [{ scheduledAt: new Date("2026-10-21T09:00:00Z"), duration: 60, status: "SCHEDULED" }],
      maxStudents: 3,
      enrollmentCount: 0,
      status: "SCHEDULED",
      published: true,
      ...overrides,
    };
  }

  it("matches learner requesting General Mathematics on exact topic overlap", () => {
    const criteria: MatchCriteria = {
      subject: "SHS_GENMATH",
      topics: ["Functions & Rational Functions"],
      gradeLevel: GradeLevel.GRADE_11,
    };

    const klass = mkClass();
    const result = scoreClass(criteria, klass, NOW);

    expect(result).not.toBeNull();
    expect(result?.score).toBeGreaterThan(0);
    expect(result?.reasons.matchedTopics).toEqual(["Functions & Rational Functions"]);
    expect(result?.reasons.gradeMatch).toBe("exact");
  });

  it("awards certified bonus when tutor holds verified certification in the curriculum topic", () => {
    const criteria: MatchCriteria = {
      subject: "SHS_STEM_PRECALC",
      topics: ["Conic Sections & Systems of Nonlinear Equations"],
      gradeLevel: GradeLevel.GRADE_11,
    };

    const uncertifiedClass = mkClass({
      subject: "SHS_STEM_PRECALC",
      topics: ["Conic Sections & Systems of Nonlinear Equations"],
      verifiedTopics: [],
    });

    const certifiedClass = mkClass({
      id: "class-2",
      subject: "SHS_STEM_PRECALC",
      topics: ["Conic Sections & Systems of Nonlinear Equations"],
      verifiedTopics: ["Conic Sections & Systems of Nonlinear Equations"],
    });

    const scoreUncertified = scoreClass(criteria, uncertifiedClass, NOW);
    const scoreCertified = scoreClass(criteria, certifiedClass, NOW);

    expect(scoreCertified?.score).toBeGreaterThan(scoreUncertified?.score ?? 0);
    expect(scoreCertified?.reasons.verifiedMatchedTopics).toContain("Conic Sections & Systems of Nonlinear Equations");
  });

  it("filters out classes when requested subject or topics do not match", () => {
    const criteria: MatchCriteria = {
      subject: "SHS_TVL_CSS",
      topics: ["PC Assembly & Operating System Deployment"],
      gradeLevel: GradeLevel.GRADE_11,
    };

    const differentSubjectClass = mkClass({ subject: "SHS_TVL_COOKERY", topics: ["Appetizers, Stocks, Soups & Sauces"] });
    expect(scoreClass(criteria, differentSubjectClass, NOW)).toBeNull();

    const differentTopicClass = mkClass({ subject: "SHS_TVL_CSS", topics: ["Server Roles & Active Directory"] });
    expect(scoreClass(criteria, differentTopicClass, NOW)).toBeNull();
  });

  it("ranks classes correctly with rankMatches on new curriculum subjects", () => {
    const criteria: MatchCriteria = {
      subject: "SHS_GENMATH",
      topics: ["Functions & Rational Functions", "Simple & Compound Interest"],
      gradeLevel: GradeLevel.GRADE_11,
    };

    const classExactTwoTopics = mkClass({
      id: "c-exact-two",
      topics: ["Functions & Rational Functions", "Simple & Compound Interest"],
      verifiedTopics: ["Functions & Rational Functions"],
      gradeLevel: GradeLevel.GRADE_11,
    });

    const classAdjacentOneTopic = mkClass({
      id: "c-adj-one",
      topics: ["Functions & Rational Functions"],
      verifiedTopics: [],
      gradeLevel: GradeLevel.GRADE_12,
    });

    const ranked = rankMatches(criteria, [classAdjacentOneTopic, classExactTwoTopics], NOW);

    expect(ranked.length).toBe(2);
    expect(ranked[0].class.id).toBe("c-exact-two");
    expect(ranked[1].class.id).toBe("c-adj-one");
  });
});
