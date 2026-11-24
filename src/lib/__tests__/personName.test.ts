import { describe, it, expect } from "vitest";
import { isValidPersonName, normalizePersonName } from "@/lib/personName";

describe("normalizePersonName", () => {
  it("title-cases an all-lowercase name", () => {
    expect(normalizePersonName("alejandro d beato")).toBe("Alejandro D Beato");
  });

  it("title-cases an all-uppercase name", () => {
    expect(normalizePersonName("ALEJANDRO D BEATO")).toBe("Alejandro D Beato");
  });

  it("leaves a mixed-case name as typed", () => {
    expect(normalizePersonName("McDonald")).toBe("McDonald");
    expect(normalizePersonName("dela Cruz")).toBe("dela Cruz");
  });

  it("capitalizes after hyphens and apostrophes", () => {
    expect(normalizePersonName("o'brien")).toBe("O'Brien");
    expect(normalizePersonName("SANTOS-REYES")).toBe("Santos-Reyes");
  });

  it("trims and collapses inner whitespace", () => {
    expect(normalizePersonName("  juan    carlos  ")).toBe("Juan Carlos");
  });

  it("composes decomposed accents into single characters", () => {
    expect(normalizePersonName("nin\u0303o")).toBe("Ni\u00f1o");
  });

  it("converts a curly apostrophe to a straight one", () => {
    expect(normalizePersonName("O\u2019Brien")).toBe("O'Brien");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizePersonName("   ")).toBe("");
  });
});

describe("isValidPersonName", () => {
  it("accepts letters, spaces, hyphens, apostrophes and periods", () => {
    for (const name of ["Juan", "Dela Cruz", "Pe\u00f1aflor", "O'Brien", "Santos-Reyes", "Ma. Teresa"]) {
      expect(isValidPersonName(name)).toBe(true);
    }
  });

  it("rejects stacked combining marks (Zalgo text)", () => {
    expect(isValidPersonName("A\u0347\u033d\u0351n\u0336g\u0489elica")).toBe(false);
  });

  it("rejects a single decorative mark that has no composed form", () => {
    expect(isValidPersonName("A\u0336na")).toBe(false);
  });

  it("rejects digits, symbols and emoji", () => {
    for (const name of ["Juan2", "Juan@", "<b>Juan</b>", "Juan \u{1F600}"]) {
      expect(isValidPersonName(name)).toBe(false);
    }
  });

  it("rejects a name that does not start with a letter", () => {
    expect(isValidPersonName("-Juan")).toBe(false);
    expect(isValidPersonName("")).toBe(false);
  });
});
