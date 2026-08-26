import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getServerSessionMock,
  userGroupBy,
  tutorClassGroupBy,
  topicCertificationGroupBy,
  classEnrollmentCount,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userGroupBy: vi.fn(),
  tutorClassGroupBy: vi.fn(),
  topicCertificationGroupBy: vi.fn(),
  classEnrollmentCount: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { groupBy: userGroupBy },
    tutorClass: { groupBy: tutorClassGroupBy },
    topicCertification: { groupBy: topicCertificationGroupBy },
    classEnrollment: { count: classEnrollmentCount },
  },
}));

import { GET } from "@/app/api/admin/reports/route";

describe("GET /api/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userGroupBy.mockResolvedValue([]);
    tutorClassGroupBy.mockResolvedValue([]);
    topicCertificationGroupBy.mockResolvedValue([]);
    classEnrollmentCount.mockResolvedValue(0);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 for a non-admin role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns flattened breakdown counts", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userGroupBy.mockResolvedValueOnce([{ role: "STUDENT_LEARNER", _count: { _all: 5 } }]);
    classEnrollmentCount.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.usersByRole).toEqual([{ role: "STUDENT_LEARNER", count: 5 }]);
    expect(json.enrollments).toEqual({ total: 10, last30Days: 3 });
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    userGroupBy.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
