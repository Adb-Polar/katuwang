import { describe, it, expect } from "vitest";
import { NO_ANALYTICS_FILTERS, analyticsChartQuery, isFiltered, periodRange } from "@/lib/analyticsCharts";

const NOW = new Date("2026-11-28T04:00:00.000Z"); // noon PHT, 28 Nov
const all = { ...NO_ANALYTICS_FILTERS, role: "STUDENT_TUTOR", gradeLevel: "GRADE_9", subject: "MATH" };

describe("analyticsChartQuery", () => {
  it("sends only the chart with no filters", () => {
    expect(analyticsChartQuery("usersByRole", NO_ANALYTICS_FILTERS, NOW)).toBe("chart=usersByRole");
  });

  it("drops filters the chart does not take", () => {
    expect(analyticsChartQuery("usersByRole", all, NOW)).toBe("chart=usersByRole&gradeLevel=GRADE_9");
    expect(analyticsChartQuery("usersByGradeLevel", all, NOW)).toBe("chart=usersByGradeLevel&role=STUDENT_TUTOR");
    expect(analyticsChartQuery("classesBySubject", all, NOW)).toBe("chart=classesBySubject&gradeLevel=GRADE_9");
    expect(analyticsChartQuery("enrollments", all, NOW)).toBe("chart=enrollments&gradeLevel=GRADE_9&subject=MATH");
  });

  it("turns a period into an inclusive school-date range", () => {
    expect(analyticsChartQuery("usersByRole", { ...NO_ANALYTICS_FILTERS, period: "7" }, NOW)).toBe(
      "chart=usersByRole&from=2026-11-22&to=2026-11-28",
    );
  });

  it("waits for both ends of a custom range", () => {
    const half = { ...NO_ANALYTICS_FILTERS, period: "custom" as const, from: "2026-11-01" };
    expect(periodRange(half)).toBeNull();
    expect(analyticsChartQuery("usersByRole", half, NOW)).toBe("chart=usersByRole");
    expect(analyticsChartQuery("usersByRole", { ...half, to: "2026-11-07" }, NOW)).toBe(
      "chart=usersByRole&from=2026-11-01&to=2026-11-07",
    );
  });
});

describe("isFiltered", () => {
  it("only counts filters the chart takes", () => {
    expect(isFiltered("usersByRole", { ...NO_ANALYTICS_FILTERS, subject: "MATH" })).toBe(false);
    expect(isFiltered("classesByStatus", { ...NO_ANALYTICS_FILTERS, subject: "MATH" })).toBe(true);
    expect(isFiltered("usersByRole", { ...NO_ANALYTICS_FILTERS, period: "30" })).toBe(true);
  });
});
