import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userGroupBy,
  tutorClassGroupBy,
  topicCertificationGroupBy,
  classEnrollmentCount,
  classEnrollmentFindMany,
  tutorClassFindMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userGroupBy: vi.fn(),
  tutorClassGroupBy: vi.fn(),
  topicCertificationGroupBy: vi.fn(),
  classEnrollmentCount: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
  tutorClassFindMany: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { groupBy: userGroupBy },
    tutorClass: { groupBy: tutorClassGroupBy, findMany: tutorClassFindMany },
    topicCertification: { groupBy: topicCertificationGroupBy },
    classEnrollment: { count: classEnrollmentCount, findMany: classEnrollmentFindMany },
  },
}));

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
    tutorClassFindMany.mockResolvedValue([]);
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
    classEnrollmentCount.mockResolvedValueOnce(10).mockResolvedValueOnce(7);
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
    expect(json.enrollments.current).toBe(7);
    expect(json.enrollments.withdrawn).toBe(3);
    expect(classEnrollmentCount).toHaveBeenCalledWith({ where: { withdrawnAt: null } });
    expect(json.enrollments.last30Days).toBe(3);
    expect(json.enrollments.byDay).toHaveLength(30);
    expect(json.enrollments.byDay.reduce((s: number, d: { count: number }) => s + d.count, 0)).toBe(3);
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userGroupBy.mockRejectedValue(new Error("DB down"));

    const res = await get();
    expect(res.status).toBe(500);
  });

  describe("filters", () => {
    beforeEach(() => getServerSessionMock.mockResolvedValue(admin));

    it("keeps all-time breakdowns and a 30-day trend when no filter is given", async () => {
      const json = await (await get()).json();
      expect(userGroupBy.mock.calls[0][0].where).toEqual({});
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({});
      expect(json.filters).toEqual({ from: null, to: null, role: null, gradeLevel: null, subject: null });
      expect(json.enrollments.bucket).toBe("day");
    });

    it("limits every breakdown to records created inside the date range", async () => {
      const json = await (await get("?from=2026-11-01&to=2026-11-07")).json();
      const range = { gte: new Date("2026-10-31T16:00:00.000Z"), lt: new Date("2026-11-07T16:00:00.000Z") };
      expect(userGroupBy.mock.calls[0][0].where).toEqual({ createdAt: range });
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ createdAt: range });
      expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({ requestedAt: range });
      expect(classEnrollmentFindMany.mock.calls[0][0].where).toEqual({ enrolledAt: range });
      expect(json.enrollments.byDay.map((d: { date: string }) => d.date)).toEqual([
        "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07",
      ]);
      expect(json.filters).toMatchObject({ from: "2026-11-01", to: "2026-11-07" });
    });

    it("counts an enrolment on the last day of the range and drops one after it", async () => {
      classEnrollmentFindMany.mockResolvedValue([
        { enrolledAt: new Date("2026-11-07T15:59:00.000Z") }, // 11:59 PM PHT on 7 Nov
      ]);
      const json = await (await get("?from=2026-11-01&to=2026-11-07")).json();
      expect(json.enrollments.byDay.at(-1)).toEqual({ date: "2026-11-07", count: 1 });
      expect(json.enrollments.inRange).toBe(1);
    });

    it("charts a long range per month", async () => {
      classEnrollmentFindMany.mockResolvedValue([
        { enrolledAt: new Date("2026-01-15T04:00:00.000Z") },
        { enrolledAt: new Date("2026-03-02T04:00:00.000Z") },
        { enrolledAt: new Date("2026-03-20T04:00:00.000Z") },
      ]);
      const json = await (await get("?from=2026-01-01&to=2026-06-30")).json();
      expect(json.enrollments.bucket).toBe("month");
      expect(json.enrollments.byDay).toEqual([
        { date: "2026-01", count: 1 }, { date: "2026-02", count: 0 }, { date: "2026-03", count: 2 },
        { date: "2026-04", count: 0 }, { date: "2026-05", count: 0 }, { date: "2026-06", count: 0 },
      ]);
    });

    it("applies the role and grade filters to the user breakdowns", async () => {
      await get("?role=STUDENT_TUTOR&gradeLevel=GRADE_10");
      expect(userGroupBy.mock.calls[0][0].where).toEqual({ role: "STUDENT_TUTOR", gradeLevel: "GRADE_10" });
    });

    it("applies the subject and grade filters to classes, certifications and enrolments", async () => {
      await get("?subject=MATH&gradeLevel=GRADE_9");
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ subject: "MATH", gradeLevel: "GRADE_9" });
      expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({
        subject: "MATH",
        tutorProfile: { user: { gradeLevel: "GRADE_9" } },
      });
      expect(classEnrollmentCount).toHaveBeenCalledWith({
        where: { withdrawnAt: null, class: { subject: "MATH" }, learner: { gradeLevel: "GRADE_9" } },
      });
    });

    it("lists every subject that has classes, whatever the subject filter", async () => {
      tutorClassFindMany.mockResolvedValue([{ subject: "MATH" }, { subject: "SCIENCE" }]);
      const json = await (await get("?subject=MATH")).json();
      expect(tutorClassFindMany.mock.calls[0][0]).toMatchObject({ distinct: ["subject"] });
      expect(json.subjectOptions).toEqual(["MATH", "SCIENCE"]);
    });

    it("ignores empty filter values", async () => {
      const res = await get("?role=&gradeLevel=&subject=&from=&to=");
      expect(res.status).toBe(200);
      expect(userGroupBy.mock.calls[0][0].where).toEqual({});
    });

    it.each([
      ["?from=2026-11-01", "Choose both a start and an end date."],
      ["?to=2026-11-01", "Choose both a start and an end date."],
      ["?from=2026-11-08&to=2026-11-01", "The end date must not be before the start date."],
      ["?from=2025-01-01&to=2026-11-01", "Choose a range of at most 366 days."],
      ["?from=11/01/2026&to=2026-11-07", "Use a date in the form YYYY-MM-DD."],
      ["?from=2026-02-31&to=2026-03-07", "Enter a real calendar date."],
      ["?role=ADMIN", "Invalid role filter."],
      ["?gradeLevel=GRADE_13", "Invalid grade level filter."],
    ])("returns 400 for %s", async (query, message) => {
      const res = await get(query);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe(message);
      expect(userGroupBy).not.toHaveBeenCalled();
    });

    it("accepts a one-day range and the longest allowed range", async () => {
      expect((await get("?from=2026-11-01&to=2026-11-01")).status).toBe(200);
      expect((await get("?from=2025-11-01&to=2026-11-01")).status).toBe(200);
    });
  });
});
