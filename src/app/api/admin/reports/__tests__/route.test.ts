import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getServerSessionMock,
  userGroupBy,
  tutorClassGroupBy,
  topicCertificationGroupBy,
  classEnrollmentCount,
  classEnrollmentFindMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userGroupBy: vi.fn(),
  tutorClassGroupBy: vi.fn(),
  topicCertificationGroupBy: vi.fn(),
  classEnrollmentCount: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { groupBy: userGroupBy },
    tutorClass: { groupBy: tutorClassGroupBy },
    topicCertification: { groupBy: topicCertificationGroupBy },
    classEnrollment: { count: classEnrollmentCount, findMany: classEnrollmentFindMany },
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/reports/route";

const get = (query = "") => GET(new NextRequest(`http://localhost/api/admin/reports${query}`));
const admin = { user: { id: "admin1", role: "ADMIN" } };

describe("GET /api/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userGroupBy.mockResolvedValue([]);
    tutorClassGroupBy.mockResolvedValue([]);
    topicCertificationGroupBy.mockResolvedValue([]);
    classEnrollmentCount.mockResolvedValue(0);
    classEnrollmentFindMany.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(401);
  });

  it("returns 401 for a non-admin role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await get();
    expect(res.status).toBe(401);
  });

  it("returns flattened breakdown counts", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userGroupBy.mockResolvedValueOnce([{ role: "STUDENT_LEARNER", _count: { _all: 5 } }]);
    classEnrollmentCount.mockResolvedValueOnce(10);
    classEnrollmentFindMany.mockResolvedValueOnce([
      { enrolledAt: new Date() },
      { enrolledAt: new Date() },
      { enrolledAt: new Date() },
    ]);

    const res = await get();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.usersByRole).toEqual([{ role: "STUDENT_LEARNER", count: 5 }]);
    expect(json.enrollments.total).toBe(10);
    expect(json.enrollments.inPeriod).toBe(3);
    expect(json.enrollments.byDay).toHaveLength(30);
    expect(json.enrollments.byDay.reduce((s: number, d: { count: number }) => s + d.count, 0)).toBe(3);
  });

  it("applies no date filter by default and reports the range as all time", async () => {
    getServerSessionMock.mockResolvedValue(admin);

    const json = await (await get()).json();

    expect(json.range).toMatchObject({ allTime: true, from: null, to: null, trendDays: 30 });
    expect(userGroupBy.mock.calls[0][0].where).toEqual({});
    expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({});
  });

  it("filters every breakdown by the date range and sizes the trend to it", async () => {
    getServerSessionMock.mockResolvedValue(admin);

    const json = await (await get("?from=2026-11-01&to=2026-11-07")).json();

    const range = { gte: new Date(2026, 10, 1), lte: new Date(2026, 10, 7, 23, 59, 59, 999) };
    expect(userGroupBy.mock.calls[0][0].where).toEqual({ createdAt: range });
    expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ createdAt: range });
    expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({ requestedAt: range });
    expect(json.range).toMatchObject({ allTime: false, from: "2026-11-01", to: "2026-11-07", trendDays: 7 });
    expect(json.enrollments.byDay.map((d: { date: string }) => d.date)).toEqual([
      "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07",
    ]);
  });

  it("applies the grade and subject filters to the right breakdowns", async () => {
    getServerSessionMock.mockResolvedValue(admin);

    await get("?gradeLevel=GRADE_10&subject=MATH");

    expect(userGroupBy.mock.calls[0][0].where).toEqual({ gradeLevel: "GRADE_10" });
    expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ gradeLevel: "GRADE_10", subject: "MATH" });
    expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({ subject: "MATH" });
    expect(classEnrollmentCount.mock.calls[0][0].where).toEqual({
      class: { subject: "MATH" },
      learner: { gradeLevel: "GRADE_10" },
    });
  });

  it.each([
    ["a start after the end", "?from=2026-11-10&to=2026-11-01"],
    ["only one date", "?from=2026-11-10"],
    ["an impossible date", "?from=2026-02-30&to=2026-03-01"],
    ["a range over 366 days", "?from=2025-01-01&to=2026-12-31"],
    ["an unknown grade level", "?gradeLevel=GRADE_99"],
  ])("returns 400 for %s", async (_label, query) => {
    getServerSessionMock.mockResolvedValue(admin);

    const res = await get(query);

    expect(res.status).toBe(400);
    expect(userGroupBy).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userGroupBy.mockRejectedValue(new Error("DB down"));

    const res = await get();
    expect(res.status).toBe(500);
  });
});
