import { describe, it, expect } from "vitest";
import { aggregateMisses, type MissRow } from "@/lib/chatbot/misses";

const row = (message: string, role: MissRow["role"], createdAt: string): MissRow => ({
  message,
  role,
  createdAt,
});

describe("aggregateMisses", () => {
  it("groups messages that normalise to the same token string, case/punctuation-insensitive", () => {
    const rows = [
      row("How do I enrol?", "STUDENT_LEARNER", "2026-09-01T00:00:00Z"),
      row("how do i enrol", "STUDENT_LEARNER", "2026-09-02T00:00:00Z"),
    ];
    const { groups, total } = aggregateMisses(rows);
    expect(total).toBe(1);
    expect(groups[0].count).toBe(2);
  });

  it("keeps groups separate per role even with identical wording", () => {
    const rows = [
      row("asdf qwerty", "STUDENT_LEARNER", "2026-09-01T00:00:00Z"),
      row("asdf qwerty", "STUDENT_TUTOR", "2026-09-01T00:00:00Z"),
    ];
    const { groups, total } = aggregateMisses(rows);
    expect(total).toBe(2);
    expect(groups.map((g) => g.role).sort()).toEqual(["STUDENT_LEARNER", "STUDENT_TUTOR"]);
  });

  it("tracks firstSeen / lastSeen and uses the most recent phrasing as the sample", () => {
    const rows = [
      row("gibberish one", "ADMIN", "2026-09-01T00:00:00Z"),
      row("GIBBERISH one!!", "ADMIN", "2026-09-05T00:00:00Z"),
    ];
    const { groups } = aggregateMisses(rows);
    expect(groups[0].firstSeen).toBe("2026-09-01T00:00:00.000Z");
    expect(groups[0].lastSeen).toBe("2026-09-05T00:00:00.000Z");
    expect(groups[0].sample).toBe("GIBBERISH one!!");
  });

  it("filters by role and by a case-insensitive text search", () => {
    const rows = [
      row("what is quantum physics", "STUDENT_LEARNER", "2026-09-01T00:00:00Z"),
      row("random nonsense", "STUDENT_TUTOR", "2026-09-01T00:00:00Z"),
    ];
    expect(aggregateMisses(rows, { role: "STUDENT_TUTOR" }).total).toBe(1);
    expect(aggregateMisses(rows, { q: "QUANTUM" }).total).toBe(1);
    expect(aggregateMisses(rows, { q: "QUANTUM" }).groups[0].sample).toContain("quantum");
  });

  it("sorts by count and by lastSeen", () => {
    const rows = [
      row("popular question", "STUDENT_LEARNER", "2026-09-01T00:00:00Z"),
      row("popular question", "STUDENT_LEARNER", "2026-09-02T00:00:00Z"),
      row("popular question", "STUDENT_LEARNER", "2026-09-03T00:00:00Z"),
      row("rare question", "STUDENT_LEARNER", "2026-09-10T00:00:00Z"),
    ];
    const byCount = aggregateMisses(rows, { sort: "count", dir: "desc" }).groups;
    expect(byCount[0].sample).toBe("popular question");

    const byLastSeen = aggregateMisses(rows, { sort: "lastSeen", dir: "desc" }).groups;
    expect(byLastSeen[0].sample).toBe("rare question");
  });

  it("falls back to lastSeen for an unrecognised sort key", () => {
    const rows = [
      row("older", "ADMIN", "2026-09-01T00:00:00Z"),
      row("newer", "ADMIN", "2026-09-05T00:00:00Z"),
    ];
    const groups = aggregateMisses(rows, { sort: "bogus" as never }).groups;
    expect(groups[0].sample).toBe("newer");
  });

  it("paginates the grouped results", () => {
    const rows = Array.from({ length: 5 }, (_, i) => row(`unique message ${i}`, "ADMIN", "2026-09-01T00:00:00Z"));
    const page1 = aggregateMisses(rows, { pageSize: 2, page: 1 });
    const page2 = aggregateMisses(rows, { pageSize: 2, page: 2 });
    expect(page1.groups).toHaveLength(2);
    expect(page2.groups).toHaveLength(2);
    expect(page1.total).toBe(5);
  });
});
