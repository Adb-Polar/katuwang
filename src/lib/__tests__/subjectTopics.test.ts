import { describe, it, expect } from "vitest";
import { normalizeTopic, isKnownTopic, SUBJECT_TOPICS } from "@/lib/subjectTopics";

describe("normalizeTopic", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeTopic("  Fractions   &  Decimals ")).toBe("Fractions & Decimals");
  });
  it("leaves an already-clean string unchanged", () => {
    expect(normalizeTopic("Algebraic Expressions")).toBe("Algebraic Expressions");
  });
});

describe("isKnownTopic", () => {
  it("matches a curated topic case-insensitively", () => {
    expect(isKnownTopic("MATH", "algebraic expressions")).toBe(true);
    expect(isKnownTopic("MATH", SUBJECT_TOPICS.MATH[0])).toBe(true);
  });
  it("returns false for a custom topic", () => {
    expect(isKnownTopic("MATH", "Competitive Math Olympiad Prep")).toBe(false);
  });
  it("returns false for a topic from a different subject", () => {
    expect(isKnownTopic("MATH", "Reading Comprehension")).toBe(false);
  });
});
