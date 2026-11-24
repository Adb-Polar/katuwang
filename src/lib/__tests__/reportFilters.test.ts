import { describe, it, expect } from "vitest";
import { bucketByDay, parseReportFilters } from "@/lib/reportFilters";

const NOW = new Date(2026, 10, 24, 15, 30); // 24 Nov 2026, local
const parse = (query: string) => parseReportFilters(new URLSearchParams(query), NOW);
const filtersOf = (query: string) => {
  const result = parse(query);
  if (!result.ok) throw new Error(result.error);
  return result.filters;
};
const errorOf = (query: string) => {
  const result = parse(query);
  return result.ok ? null : result.error;
};

describe("parseReportFilters", () => {
  it("defaults to all time with a 30-day trend ending today", () => {
    const filters = filtersOf("");
    expect(filters.from).toBeNull();
    expect(filters.to).toBeNull();
    expect(filters.trendDays).toBe(30);
    expect(filters.trendFrom).toEqual(new Date(2026, 9, 26));
  });

  it("covers both boundary days in full", () => {
    const filters = filtersOf("from=2026-11-01&to=2026-11-07");
    expect(filters.from).toEqual(new Date(2026, 10, 1, 0, 0, 0, 0));
    expect(filters.to).toEqual(new Date(2026, 10, 7, 23, 59, 59, 999));
    expect(filters.trendDays).toBe(7);
  });

  it("accepts a single-day range", () => {
    expect(filtersOf("from=2026-11-05&to=2026-11-05").trendDays).toBe(1);
  });

  it("accepts the 366-day maximum and rejects 367", () => {
    expect(filtersOf("from=2026-01-01&to=2027-01-01").trendDays).toBe(366);
    expect(errorOf("from=2026-01-01&to=2027-01-02")).toMatch(/366 days/);
  });

  it("rejects only one of the two dates", () => {
    expect(errorOf("from=2026-11-01")).toMatch(/both/);
    expect(errorOf("to=2026-11-01")).toMatch(/both/);
  });

  it("rejects a start after the end", () => {
    expect(errorOf("from=2026-11-10&to=2026-11-01")).toMatch(/must not be after/);
  });

  it.each(["2026-02-30", "2026-13-01", "11/01/2026", "yesterday"])("rejects the invalid date %s", (date) => {
    expect(errorOf(`from=${date}&to=2026-12-01`)).toMatch(/valid/);
  });

  it("passes grade level and subject through", () => {
    expect(filtersOf("gradeLevel=GRADE_10&subject=MATH")).toMatchObject({ gradeLevel: "GRADE_10", subject: "MATH" });
  });

  it("treats blank grade and subject as no filter", () => {
    expect(filtersOf("gradeLevel=&subject=%20")).toMatchObject({ gradeLevel: null, subject: null });
  });

  it("rejects an unknown grade level", () => {
    expect(errorOf("gradeLevel=GRADE_13")).toBe("Invalid grade level.");
  });
});

describe("bucketByDay", () => {
  it("zero-fills every day and counts dates on their local day", () => {
    const series = bucketByDay(
      [new Date(2026, 10, 1, 0, 0), new Date(2026, 10, 1, 23, 59), new Date(2026, 10, 3, 12, 0)],
      new Date(2026, 10, 1),
      3
    );
    expect(series).toEqual([
      { date: "2026-11-01", count: 2 },
      { date: "2026-11-02", count: 0 },
      { date: "2026-11-03", count: 1 },
    ]);
  });

  it("ignores dates outside the window", () => {
    const series = bucketByDay([new Date(2026, 9, 31), new Date(2026, 10, 2)], new Date(2026, 10, 1), 1);
    expect(series).toEqual([{ date: "2026-11-01", count: 0 }]);
  });

  it("rolls over a month boundary", () => {
    expect(bucketByDay([], new Date(2026, 10, 30), 2).map((d) => d.date)).toEqual(["2026-11-30", "2026-12-01"]);
  });
});
