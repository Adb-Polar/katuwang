import { describe, it, expect } from "vitest";
import { isValidPersonName, normalizePersonName, repairPersonName } from "@/lib/personName";

describe("normalizePersonName", () => {
  it("title-cases an all-lowercase name", () => {
    expect(normalizePersonName("alejandro d beato")).toBe("Alejandro D Beato");
  });

  it("title-cases an all-uppercase name", () => {
    expect(normalizePersonName("ALEJANDRO D BEATO")).toBe("Alejandro D Beato");
  });

  it("keeps the inner casing of a mixed-case name", () => {
    expect(normalizePersonName("McDonald")).toBe("McDonald");
    expect(normalizePersonName("Maria dela Cruz")).toBe("Maria dela Cruz");
  });

  it("capitalizes the first letter of a mixed-case name", () => {
    expect(normalizePersonName("alejandro D Beato")).toBe("Alejandro D Beato");
    expect(normalizePersonName("dela Cruz")).toBe("Dela Cruz");
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

describe("repairPersonName", () => {
  it("normalizes a valid stored name", () => {
    expect(repairPersonName("  alejandro D  beato ")).toBe("Alejandro D beato");
    expect(repairPersonName("RICO CADAG")).toBe("Rico Cadag");
  });

  it("strips decorative marks from Zalgo text", () => {
    expect(repairPersonName("A\u0347\u033d\u0351n\u0336g\u0489elica")).toBe("Angelica");
  });

  it("removes every mark from Zalgo text, including ones NFC composed", () => {
    const zalgo = "A\u0323\u0327\u0301\u0308n\u0327\u0331\u0308\u0302a";
    expect(zalgo.normalize("NFC")).not.toBe(zalgo);
    expect(repairPersonName(zalgo)).toBe("Ana");
  });

  it("leaves a valid name whose letters carry two composed marks", () => {
    expect(repairPersonName("Vi\u1ec7t")).toBe("Vi\u1ec7t");
  });

  it("keeps real accents when stripping single decorative marks", () => {
    expect(repairPersonName("Pen\u0303a\u0336")).toBe("Pe\u00f1a");
  });

  it("returns null when the name cannot be repaired", () => {
    expect(repairPersonName("Juan123")).toBeNull();
    expect(repairPersonName("\u0347\u033d")).toBeNull();
  });
});
