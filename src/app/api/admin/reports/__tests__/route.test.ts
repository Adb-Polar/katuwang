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

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { groupBy: userGroupBy },
    tutorClass: { groupBy: tutorClassGroupBy, findMany: tutorClassFindMany },
    topicCertification: { groupBy: topicCertificationGroupBy },
    classEnrollment: { count: classEnrollmentCount, findMany: classEnrollmentFindMany },
  },
}));

import { GET } from "@/app/api/admin/reports/route";

const get = (query: string) => GET(new NextRequest(`http://localhost/api/admin/reports?${query}`));
const admin = { user: { id: "admin1", role: "ADMIN" } };
const RANGE_1_TO_7_NOV = { gte: new Date("2026-10-31T16:00:00.000Z"), lt: new Date("2026-11-07T16:00:00.000Z") };

describe("GET /api/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(admin);
    userGroupBy.mockResolvedValue([]);
    tutorClassGroupBy.mockResolvedValue([]);
    topicCertificationGroupBy.mockResolvedValue([]);
    classEnrollmentCount.mockResolvedValue(0);
    classEnrollmentFindMany.mockResolvedValue([]);
    tutorClassFindMany.mockResolvedValue([]);
  });

  describe("access and validation", () => {
    it("returns 401 when unauthenticated", async () => {
      getServerSessionMock.mockResolvedValue(null);
      expect((await get("chart=usersByRole")).status).toBe(401);
    });

    it("returns 401 for a non-admin role", async () => {
      getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
      expect((await get("chart=usersByRole")).status).toBe(401);
    });

    it.each([
      ["", "Choose a chart."],
      ["chart=everything", "Choose a chart."],
      ["chart=usersByRole&from=2026-11-01", "Choose both a start and an end date."],
      ["chart=usersByRole&to=2026-11-01", "Choose both a start and an end date."],
      ["chart=usersByRole&from=2026-11-08&to=2026-11-01", "The end date must not be before the start date."],
      ["chart=usersByRole&from=2025-01-01&to=2026-11-01", "Choose a range of at most 366 days."],
      ["chart=usersByRole&from=11/01/2026&to=2026-11-07", "Use a date in the form YYYY-MM-DD."],
      ["chart=usersByRole&from=2026-02-31&to=2026-03-07", "Enter a real calendar date."],
      ["chart=usersByStatus&role=ADMIN", "Invalid role filter."],
      ["chart=usersByStatus&gradeLevel=GRADE_13", "Invalid grade level filter."],
    ])("returns 400 for ?%s", async (query, message) => {
      const res = await get(query);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe(message);
      expect(userGroupBy).not.toHaveBeenCalled();
    });

    it("accepts a one-day range and the longest allowed range", async () => {
      expect((await get("chart=usersByRole&from=2026-11-01&to=2026-11-01")).status).toBe(200);
      expect((await get("chart=usersByRole&from=2025-11-01&to=2026-11-01")).status).toBe(200);
    });

    it("ignores empty filter values", async () => {
      const res = await get("chart=usersByStatus&role=&gradeLevel=&subject=&from=&to=");
      expect(res.status).toBe(200);
      expect(userGroupBy.mock.calls[0][0].where).toEqual({});
    });

    it("returns 500 on unexpected error", async () => {
      userGroupBy.mockRejectedValue(new Error("DB down"));
      expect((await get("chart=usersByRole")).status).toBe(500);
    });
  });

  describe("breakdown charts", () => {
    it.each([
      ["usersByRole", userGroupBy, "role", "STUDENT_LEARNER"],
      ["usersByGradeLevel", userGroupBy, "gradeLevel", "GRADE_8"],
      ["usersByStatus", userGroupBy, "status", "ACTIVE"],
      ["classesBySubject", tutorClassGroupBy, "subject", "MATH"],
      ["classesByStatus", tutorClassGroupBy, "status", "SCHEDULED"],
      ["certificationsByStatus", topicCertificationGroupBy, "status", "APPROVED"],
    ] as const)("%s runs only its own query and returns flattened rows", async (chart, groupBy, field, value) => {
      groupBy.mockResolvedValueOnce([{ [field]: value, _count: { _all: 5 } }]);
      const json = await (await get(`chart=${chart}`)).json();
      expect(json).toMatchObject({ chart, rows: [{ [field]: value, count: 5 }] });
      expect(groupBy).toHaveBeenCalledTimes(1);
      expect(groupBy.mock.calls[0][0].by).toEqual([field]);
      expect(classEnrollmentCount).not.toHaveBeenCalled();
    });

    it("limits a breakdown to records created inside the date range", async () => {
      await get("chart=usersByStatus&from=2026-11-01&to=2026-11-07");
      await get("chart=classesByStatus&from=2026-11-01&to=2026-11-07");
      await get("chart=certificationsByStatus&from=2026-11-01&to=2026-11-07");
      expect(userGroupBy.mock.calls[0][0].where).toEqual({ createdAt: RANGE_1_TO_7_NOV });
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ createdAt: RANGE_1_TO_7_NOV });
      expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({ requestedAt: RANGE_1_TO_7_NOV });
    });

    it("applies role and grade to users by status", async () => {
      await get("chart=usersByStatus&role=STUDENT_TUTOR&gradeLevel=GRADE_10");
      expect(userGroupBy.mock.calls[0][0].where).toEqual({ role: "STUDENT_TUTOR", gradeLevel: "GRADE_10" });
    });

    it("ignores the filter a chart groups by and filters it does not take", async () => {
      await get("chart=usersByRole&role=STUDENT_TUTOR&subject=MATH&gradeLevel=GRADE_10");
      await get("chart=usersByGradeLevel&role=STUDENT_TUTOR&gradeLevel=GRADE_10");
      await get("chart=classesBySubject&subject=MATH&role=STUDENT_TUTOR&gradeLevel=GRADE_9");
      expect(userGroupBy.mock.calls[0][0].where).toEqual({ gradeLevel: "GRADE_10" });
      expect(userGroupBy.mock.calls[1][0].where).toEqual({ role: "STUDENT_TUTOR" });
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ gradeLevel: "GRADE_9" });
    });

    it("applies subject and grade to classes by status and certifications", async () => {
      await get("chart=classesByStatus&subject=MATH&gradeLevel=GRADE_9");
      await get("chart=certificationsByStatus&subject=MATH&gradeLevel=GRADE_9");
      expect(tutorClassGroupBy.mock.calls[0][0].where).toEqual({ subject: "MATH", gradeLevel: "GRADE_9" });
      expect(topicCertificationGroupBy.mock.calls[0][0].where).toEqual({
        subject: "MATH",
        tutorProfile: { user: { gradeLevel: "GRADE_9" } },
      });
    });
  });

  describe("subject options", () => {
    it("lists every subject that has classes for charts that take a subject, whatever the filter", async () => {
      tutorClassFindMany.mockResolvedValue([{ subject: "MATH" }, { subject: "SCIENCE" }]);
      const json = await (await get("chart=classesByStatus&subject=MATH")).json();
      expect(tutorClassFindMany.mock.calls[0][0]).toMatchObject({ distinct: ["subject"] });
      expect(json.subjectOptions).toEqual(["MATH", "SCIENCE"]);
    });

    it("skips the subject list for charts without a subject filter", async () => {
      const json = await (await get("chart=usersByRole")).json();
      expect(tutorClassFindMany).not.toHaveBeenCalled();
      expect(json).not.toHaveProperty("subjectOptions");
    });
  });

  describe("enrollments chart", () => {
    it("returns all-time counts and a 30-day daily trend with no filter", async () => {
      classEnrollmentCount.mockResolvedValueOnce(10).mockResolvedValueOnce(7);
      classEnrollmentFindMany.mockResolvedValueOnce([{ enrolledAt: new Date() }, { enrolledAt: new Date() }, { enrolledAt: new Date() }]);
      const json = await (await get("chart=enrollments")).json();
      expect(json.enrollments).toMatchObject({ total: 10, current: 7, withdrawn: 3, inRange: 3, bucket: "day" });
      expect(json.enrollments.byDay).toHaveLength(30);
      expect(json.enrollments.byDay.reduce((s: number, d: { count: number }) => s + d.count, 0)).toBe(3);
      expect(classEnrollmentCount).toHaveBeenCalledWith({ where: { withdrawnAt: null } });
      expect(userGroupBy).not.toHaveBeenCalled();
    });

    it("limits counts and the trend to the date range", async () => {
      const json = await (await get("chart=enrollments&from=2026-11-01&to=2026-11-07")).json();
      expect(classEnrollmentCount).toHaveBeenCalledWith({ where: { enrolledAt: RANGE_1_TO_7_NOV } });
      expect(classEnrollmentFindMany.mock.calls[0][0].where).toEqual({ enrolledAt: RANGE_1_TO_7_NOV });
      expect(json.enrollments.byDay.map((d: { date: string }) => d.date)).toEqual([
        "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07",
      ]);
    });

    it("counts an enrolment on the last day of the range and drops one after it", async () => {
      classEnrollmentFindMany.mockResolvedValue([{ enrolledAt: new Date("2026-11-07T15:59:00.000Z") }]); // 11:59 PM PHT on 7 Nov
      const json = await (await get("chart=enrollments&from=2026-11-01&to=2026-11-07")).json();
      expect(json.enrollments.byDay.at(-1)).toEqual({ date: "2026-11-07", count: 1 });
      expect(json.enrollments.inRange).toBe(1);
    });

    it("charts a long range per month", async () => {
      classEnrollmentFindMany.mockResolvedValue([
        { enrolledAt: new Date("2026-01-15T04:00:00.000Z") },
        { enrolledAt: new Date("2026-03-02T04:00:00.000Z") },
        { enrolledAt: new Date("2026-03-20T04:00:00.000Z") },
      ]);
      const json = await (await get("chart=enrollments&from=2026-01-01&to=2026-06-30")).json();
      expect(json.enrollments.bucket).toBe("month");
      expect(json.enrollments.byDay).toEqual([
        { date: "2026-01", count: 1 }, { date: "2026-02", count: 0 }, { date: "2026-03", count: 2 },
        { date: "2026-04", count: 0 }, { date: "2026-05", count: 0 }, { date: "2026-06", count: 0 },
      ]);
    });

    it("applies subject and grade but not role", async () => {
      await get("chart=enrollments&subject=MATH&gradeLevel=GRADE_9&role=STUDENT_TUTOR");
      expect(classEnrollmentCount).toHaveBeenCalledWith({
        where: { withdrawnAt: null, class: { subject: "MATH" }, learner: { gradeLevel: "GRADE_9" } },
      });
    });
  });
});
