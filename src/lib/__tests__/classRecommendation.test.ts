import { describe, it, expect } from "vitest";
import { classRecommendationMessage } from "@/lib/classRecommendation";
import { formatDateTime } from "@/lib/datetime";

const base = { subject: "ARTS", code: "C-0010", gradeLevel: null, tutorAnonymousId: null, topics: [], nextSessionAt: null };

describe("classRecommendationMessage", () => {
  it("names the class and says when nothing is scheduled", () => {
    expect(classRecommendationMessage(base)).toBe(
      "An administrator recommended the ARTS class (C-0010) for you. No upcoming session is scheduled yet.",
    );
  });

  it("adds grade, tutor ID, topics and the next session", () => {
    const next = new Date("2026-12-01T07:00:00.000Z");
    const message = classRecommendationMessage({
      ...base,
      gradeLevel: "GRADE_8",
      tutorAnonymousId: "TUT-0002",
      topics: ["Color theory", "Drawing"],
      nextSessionAt: next,
    });
    expect(message).toBe(
      `An administrator recommended the ARTS class (C-0010) for you — Grade 8, tutor TUT-0002, topics: Color theory, Drawing. Next session: ${formatDateTime(next)}.`,
    );
  });

  it("lists at most three topics", () => {
    expect(classRecommendationMessage({ ...base, topics: ["A", "B", "C", "D", "E"] })).toContain("topics: A, B, C and 2 more.");
  });
});
