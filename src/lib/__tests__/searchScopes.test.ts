import { describe, expect, it } from "vitest";
import { fallbackScope, parseScope, searchPageHref } from "@/lib/searchScopes";

describe("parseScope", () => {
  it("keeps a scope the audience has", () => {
    expect(parseScope("admin", "student")).toBe("student");
    expect(parseScope("learner", "class")).toBe("class");
  });

  it("falls back to the audience default for a missing or foreign scope", () => {
    expect(parseScope("admin", undefined)).toBe("tutor");
    expect(parseScope("admin", "all")).toBe("tutor");
    expect(parseScope("admin", "topic")).toBe("tutor");
    expect(parseScope("learner", "all")).toBe("tutor");
    expect(parseScope("learner", "tutorCode")).toBe("tutor");
  });
});

describe("fallbackScope", () => {
  it("offers learners the other entity", () => {
    expect(fallbackScope("learner", "tutor")?.scope).toBe("class");
    expect(fallbackScope("learner", "class")?.scope).toBe("tutor");
  });

  it("offers admins the other kind of account, and nothing after a class search", () => {
    expect(fallbackScope("admin", "tutor")?.scope).toBe("student");
    expect(fallbackScope("admin", "student")?.scope).toBe("tutor");
    expect(fallbackScope("admin", "class")).toBeNull();
  });
});

describe("searchPageHref", () => {
  it("builds the portal's results URL with an encoded query", () => {
    expect(searchPageHref("learner", "linear equations", "class")).toBe("/learner/search?q=linear%20equations&scope=class");
    expect(searchPageHref("admin", "a&b", "class")).toBe("/admin/search?q=a%26b&scope=class");
  });
});
