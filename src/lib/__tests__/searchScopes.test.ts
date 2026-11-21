import { describe, expect, it } from "vitest";
import { fallbackScope, parseScope, searchPageHref } from "@/lib/searchScopes";

describe("parseScope", () => {
  it("keeps a scope the audience has", () => {
    expect(parseScope("admin", "topic")).toBe("topic");
    expect(parseScope("learner", "class")).toBe("class");
  });

  it("falls back to the audience default for a missing or foreign scope", () => {
    expect(parseScope("admin", undefined)).toBe("all");
    expect(parseScope("learner", "all")).toBe("tutor");
    expect(parseScope("learner", "tutorCode")).toBe("tutor");
  });
});

describe("fallbackScope", () => {
  it("offers learners the other entity", () => {
    expect(fallbackScope("learner", "tutor")?.scope).toBe("class");
    expect(fallbackScope("learner", "class")?.scope).toBe("tutor");
  });

  it("offers admins everything, unless they already searched everything", () => {
    expect(fallbackScope("admin", "subject")?.scope).toBe("all");
    expect(fallbackScope("admin", "all")).toBeNull();
  });
});

describe("searchPageHref", () => {
  it("builds the portal's results URL with an encoded query", () => {
    expect(searchPageHref("learner", "linear equations", "class")).toBe("/learner/search?q=linear%20equations&scope=class");
    expect(searchPageHref("admin", "a&b", "all")).toBe("/admin/search?q=a%26b&scope=all");
  });
});
