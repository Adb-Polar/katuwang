import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { subject: { findMany: findManyMock } } }));

import {
  getSubjects,
  getTopics,
  subjectExists,
  topicExists,
  getSubjectSlugs,
  invalidateSubjectCache,
} from "@/lib/subjects";

function subject(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "s1",
    slug: "MATH",
    name: "Mathematics",
    order: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    topics: [
      { id: "t1", subjectId: "s1", name: "Algebraic Expressions", order: 0, active: true, createdAt: new Date() },
      { id: "t2", subjectId: "s1", name: "Retired Topic", order: 1, active: false, createdAt: new Date() },
    ],
    ...over,
  };
}

describe("lib/subjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateSubjectCache();
  });

  it("caches the DB read across calls", async () => {
    findManyMock.mockResolvedValue([subject()]);
    await getSubjects();
    await getSubjects();
    await getTopics("MATH");
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it("filters inactive subjects and topics by default", async () => {
    findManyMock.mockResolvedValue([
      subject(),
      subject({ id: "s2", slug: "OLD", name: "Retired Subject", active: false, topics: [] }),
    ]);
    const subjects = await getSubjects();
    expect(subjects.map((s) => s.slug)).toEqual(["MATH"]);
    expect(subjects[0].topics.map((t) => t.name)).toEqual(["Algebraic Expressions"]);

    invalidateSubjectCache();
    findManyMock.mockResolvedValue([
      subject(),
      subject({ id: "s2", slug: "OLD", name: "Retired Subject", active: false, topics: [] }),
    ]);
    const all = await getSubjects({ includeInactive: true });
    expect(all.map((s) => s.slug)).toEqual(["MATH", "OLD"]);
  });

  it("topicExists is case-insensitive and honours active", async () => {
    findManyMock.mockResolvedValue([subject()]);
    expect(await topicExists("MATH", "algebraic EXPRESSIONS")).toBe(true);
    expect(await topicExists("MATH", "Retired Topic")).toBe(false); // inactive
    expect(await topicExists("MATH", "Retired Topic", { includeInactive: true })).toBe(true);
    expect(await topicExists("SCIENCE", "Anything")).toBe(false); // unknown subject
  });

  it("subjectExists + getSubjectSlugs", async () => {
    findManyMock.mockResolvedValue([subject()]);
    expect(await subjectExists("MATH")).toBe(true);
    expect(await subjectExists("NOPE")).toBe(false);
    expect(await getSubjectSlugs()).toEqual(["MATH"]);
  });
});
