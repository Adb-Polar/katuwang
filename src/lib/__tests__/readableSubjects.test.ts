import { describe, expect, it } from "vitest";
import { keepCodesTogether, readableSubjects } from "../displayLabels";

describe("readableSubjects", () => {
  it("replaces subject codes inside a notification message", () => {
    expect(readableSubjects("STU-0329 enrolled in your JHS_ARALING_PANLIPUNAN class (C-0241)."))
      .toBe("STU-0329 enrolled in your Araling Panlipunan class (C-0241).");
    expect(readableSubjects("You're now certified to teach MATH · Fractions.")).toBe("You're now certified to teach Mathematics · Fractions.");
  });

  it("leaves IDs, codes and ordinary words alone", () => {
    const text = "TUT-0145 made a class (C-0007). OK, see you at 9 AM.";
    expect(readableSubjects(text)).toBe(text);
  });
});

describe("keepCodesTogether", () => {
  it("joins the parts of class and learner codes so they don't wrap at the hyphen", () => {
    expect(keepCodesTogether("STU-0329 joined C-0241.")).toBe("STU-\u20600329 joined C-\u20600241.");
    expect(keepCodesTogether("A well-known topic")).toBe("A well-known topic");
  });
});
