import { describe, it, expect } from "vitest";
import { averageGain, studentSessionResults, type StudentAttempt } from "@/lib/studentTestSummary";

const attempt = (sessionId: string, day: number, kind: "PRE" | "POST", scorePercent: number): StudentAttempt => ({
  kind,
  scorePercent,
  sessionTest: {
    session: { id: sessionId, topic: `Topic ${sessionId}`, scheduledAt: new Date(2026, 10, day), class: { id: "c1", code: "C-0010" } },
  },
});

describe("studentSessionResults", () => {
  it("pairs pre and post per session, newest first", () => {
    const results = studentSessionResults([
      attempt("s1", 1, "PRE", 40),
      attempt("s2", 5, "PRE", 60),
      attempt("s1", 1, "POST", 80),
    ]);
    expect(results.map((r) => [r.sessionId, r.pre, r.post])).toEqual([
      ["s2", 60, null],
      ["s1", 40, 80],
    ]);
    expect(results[1]).toMatchObject({ classId: "c1", classCode: "C-0010", topic: "Topic s1" });
  });

  it("returns nothing for no attempts", () => {
    expect(studentSessionResults([])).toEqual([]);
  });
});

describe("averageGain", () => {
  it("averages only sessions with both scores, rounded", () => {
    const results = studentSessionResults([
      attempt("s1", 1, "PRE", 40),
      attempt("s1", 1, "POST", 80),
      attempt("s2", 2, "PRE", 50),
      attempt("s2", 2, "POST", 45),
      attempt("s3", 3, "PRE", 10),
    ]);
    expect(averageGain(results)).toBe(18); // (40 + -5) / 2 = 17.5
  });

  it("is null when no session has both scores", () => {
    expect(averageGain(studentSessionResults([attempt("s1", 1, "PRE", 40)]))).toBeNull();
  });
});
