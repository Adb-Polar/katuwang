import { describe, it, expect } from "vitest";
import { curriculumFor, CURRICULUM_SOURCES, readGradeLevels, adminCurriculumNote } from "@/lib/curriculum";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { createSubjectSchema, createTopicSchema, updateSubjectSchema, updateTopicSchema } from "@/lib/validations/subject";

describe("curriculum coverage integrity", () => {
  it("assigns every canonical subject and topic with traceable evidence", () => {
    for (const [slug, topics] of Object.entries(SUBJECT_TOPICS)) {
      const subject = curriculumFor(slug);
      expect(subject.gradeLevels.length).toBeGreaterThan(0);
      for (const name of topics) {
        const topic = curriculumFor(slug, name);
        expect(topic.gradeLevels.length, `${slug}: ${name}`).toBeGreaterThan(0);
        expect(topic.gradeLevels.every((g) => subject.gradeLevels.includes(g))).toBe(true);
        expect(topic.curriculum?.note.length).toBeGreaterThan(20);
        expect(topic.curriculum?.sources.length).toBeGreaterThan(0);
        for (const source of topic.curriculum!.sources) expect(source?.url).toMatch(/^https:\/\//);
      }
    }
    expect(Object.keys(CURRICULUM_SOURCES).length).toBeGreaterThanOrEqual(9);
  });

  it("preserves uncertainty and avoids invented SHS assignments", () => {
    expect(curriculumFor("FILIPINO", "Pagsasalin").curriculum?.status).toBe("legacy");
    expect(curriculumFor("MATH", "Whole Numbers & Operations").curriculum?.status).toBe("foundation");
    expect(curriculumFor("SCIENCE", "Human Body Systems").gradeLevels).toEqual(["GRADE_8", "GRADE_10"]);
    expect(curriculumFor("MATH", "Trigonometry").gradeLevels).toEqual(["GRADE_9", "GRADE_10"]);
    expect(curriculumFor("MATH", "Fractions & Decimals").gradeLevels).not.toContain("GRADE_11");
  });

  it("keeps custom entries unassigned and does not leak mutable arrays", () => {
    expect(curriculumFor("CUSTOM").gradeLevels).toEqual([]);
    expect(curriculumFor("MATH", "Custom topic").curriculum).toBeUndefined();
    const grades = curriculumFor("MATH").gradeLevels;
    grades.pop();
    expect(curriculumFor("MATH").gradeLevels).toHaveLength(4);
    expect(readGradeLevels(["GRADE_10", "GRADE_7", "GRADE_99", "GRADE_7"])).toEqual(["GRADE_7", "GRADE_10"]);
  });

  it("requires real, nonempty, unique grade assignments on create and validates patches", () => {
    const subject = { name: "Robotics", slug: "ROBOTICS" };
    expect(createSubjectSchema.safeParse(subject).success).toBe(false);
    for (const gradeLevels of [[], ["GRADE_1"], ["GRADE_7", "GRADE_7"]]) {
      expect(createSubjectSchema.safeParse({ ...subject, gradeLevels }).success).toBe(false);
      expect(createTopicSchema.safeParse({ name: "Coding", gradeLevels }).success).toBe(false);
    }
    expect(createSubjectSchema.safeParse({ ...subject, gradeLevels: ["GRADE_11"] }).success).toBe(true);
    expect(updateSubjectSchema.safeParse({ gradeLevels: ["GRADE_8"] }).success).toBe(true);
    expect(updateTopicSchema.safeParse({ gradeLevels: [] }).success).toBe(false);
    expect(updateTopicSchema.safeParse({ active: false }).success).toBe(true);
    expect(updateSubjectSchema.safeParse({}).success).toBe(false);
  });

  it("does not attribute admin changes to the researched sources", () => {
    expect(adminCurriculumNote("School-specific elective")).toMatchObject({ status: "admin", sources: [], note: "School-specific elective" });
  });
});
