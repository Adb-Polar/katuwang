import { describe, it, expect } from "vitest";
import { editDistance, fuzzyHit, tokenize, STOPWORDS } from "@/lib/chatbot/normalize";

describe("editDistance", () => {
  it("computes the classic Levenshtein distance", () => {
    // `max` bounds the work done (callers only care whether distance <= 1),
    // so a distance that exceeds it must be requested with a wider budget.
    expect(editDistance("kitten", "sitting", 5)).toBe(3);
    expect(editDistance("enrol", "enroll")).toBe(1);
    expect(editDistance("same", "same")).toBe(0);
  });

  it("handles empty strings", () => {
    expect(editDistance("", "")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("abc", "")).toBe(3);
  });
});

describe("fuzzyHit", () => {
  it("matches exact tokens", () => {
    expect(fuzzyHit("enroll", "enroll")).toBe(true);
  });

  it("matches a single-edit typo of a keyword at least 4 chars long", () => {
    expect(fuzzyHit("enrol", "enroll")).toBe(true);
    expect(fuzzyHit("notificaton", "notification")).toBe(true);
  });

  it("does not match short words fuzzily", () => {
    expect(fuzzyHit("cat", "car")).toBe(false);
  });

  it("does not match words more than one edit apart", () => {
    expect(fuzzyHit("recieve", "receive")).toBe(false); // 2 transpositions apart
    expect(fuzzyHit("xyzabc", "enroll")).toBe(false);
  });
});

describe("tokenize", () => {
  it("drops stopwords, including ones used as dead keywords previously", () => {
    expect(tokenize("this is my class")).not.toContain("my");
    expect(tokenize("hello there")).toEqual([]);
  });

  it("folds Taglish synonyms to their canonical token", () => {
    expect(tokenize("paano sumali sa klase")).toEqual(["how", "enroll", "class"]);
  });
});

describe("catalogue keyword hygiene", () => {
  it("no chatbot keyword list should contain a word tokenize() would drop", async () => {
    const { INTENTS } = await import("@/lib/chatbot/intents");
    const { FAQ_ENTRIES } = await import("@/lib/chatbot/faq");
    const offenders: string[] = [];
    for (const intent of INTENTS) {
      for (const kw of intent.keywords) if (STOPWORDS.has(kw)) offenders.push(`${intent.id}: ${kw}`);
    }
    for (const entry of FAQ_ENTRIES) {
      for (const kw of entry.keywords) if (STOPWORDS.has(kw)) offenders.push(`${entry.id}: ${kw}`);
    }
    expect(offenders).toEqual([]);
  });
});
