import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userFindFirst,
  userFindMany,
  classFindUnique,
  enrollmentFindFirst,
  enrollmentFindUnique,
  reportFindFirst,
  reportFindMany,
  reportCreate,
  notifyManyMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindFirst: vi.fn(),
  userFindMany: vi.fn(),
  classFindUnique: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  reportFindFirst: vi.fn(),
  reportFindMany: vi.fn(),
  reportCreate: vi.fn(),
  notifyManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/notifications", () => ({ notifyMany: notifyManyMock }));
vi.mock("@/lib/prisma", () => {
  const tx = {
    report: { create: reportCreate },
    user: { findMany: userFindMany },
  };
  return {
    prisma: {
      user: { findFirst: userFindFirst },
      tutorClass: { findUnique: classFindUnique },
      classEnrollment: { findFirst: enrollmentFindFirst, findUnique: enrollmentFindUnique },
      report: { findFirst: reportFindFirst, findMany: reportFindMany, create: reportCreate },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    },
  };
});

import { GET, POST } from "@/app/api/learner/reports/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER", anonymousId: "STU-0003" } };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/learner/reports", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const tutorBody = {
  targetType: "TUTOR",
  targetId: "TUTOR_USER_1",
  violations: ["NO_SHOW_OR_ABSENCE", "UNPROFESSIONAL_CONDUCT"],
};

describe("POST /api/learner/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirst.mockResolvedValue({
      tutorProfile: { id: "tp1", user: { anonymousId: "TUT-0007" } },
    });
    classFindUnique.mockResolvedValue({ id: "c1", code: "C-0231", subject: "MATH" });
    enrollmentFindFirst.mockResolvedValue({ id: "e1" });
    enrollmentFindUnique.mockResolvedValue({ id: "e1" });
    reportFindFirst.mockResolvedValue(null);
    reportCreate.mockResolvedValue({ id: "r1", status: "PENDING" });
    userFindMany.mockResolvedValue([{ id: "admin1" }, { id: "admin2" }]);
  });

  it("401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U9", role: "STUDENT_TUTOR" } });
    const res = await POST(req(tutorBody));
    expect(res.status).toBe(401);
  });

  it("400 when no violation is selected", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(req({ ...tutorBody, violations: [] }));
    expect(res.status).toBe(400);
  });

  it("400 when Other is picked without a description", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(      req({ ...tutorBody, violations: ["OTHER"], details: "too short" }));
    expect(res.status).toBe(400);
  });

  it("404 when the tutor does not exist", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    userFindFirst.mockResolvedValue(null);
    const res = await POST(req(tutorBody));
    expect(res.status).toBe(404);
  });

  it("403 when the learner has no class with that tutor", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    enrollmentFindFirst.mockResolvedValue(null);
    const res = await POST(req(tutorBody));
    expect(res.status).toBe(403);
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("409 when an open report about that tutor already exists", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    reportFindFirst.mockResolvedValue({ id: "r0" });
    const res = await POST(req(tutorBody));
    expect(res.status).toBe(409);
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("201 and creates the report with its violation rows", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(req(tutorBody));
    expect(res.status).toBe(201);
    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: "L1",
          targetType: "TUTOR",
          reportedTutorProfileId: "tp1",
          violations: { create: [{ type: "NO_SHOW_OR_ABSENCE" }, { type: "UNPROFESSIONAL_CONDUCT" }] },
        }),
      })
    );
  });

  it("notifies every active admin without leaking the reporter's id", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await POST(req(tutorBody));
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "ADMIN", status: "ACTIVE" } })
    );
    const [, ids, type, message, link] = notifyManyMock.mock.calls[0];
    expect(ids).toEqual(["admin1", "admin2"]);
    expect(type).toBe("REPORT_NEW");
    expect(message).toContain("TUT-0007");
    expect(message).not.toContain("STU-0003");
    expect(link).toBe("/admin/abuse-reports");
  });

  it("reports a class the learner is enrolled in", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await POST(      req({ targetType: "CLASS", targetId: "c1", violations: ["OFF_TOPIC_SESSIONS"] }));
    expect(res.status).toBe(201);
    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetType: "CLASS", classId: "c1" }),
      })
    );
  });

  it("403 when reporting a class the learner is not enrolled in", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    enrollmentFindUnique.mockResolvedValue(null);
    const res = await POST(      req({ targetType: "CLASS", targetId: "c1", violations: ["OFF_TOPIC_SESSIONS"] }));
    expect(res.status).toBe(403);
  });
});

describe("GET /api/learner/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportFindMany.mockResolvedValue([
      {
        id: "r1",
        targetType: "TUTOR",
        details: null,
        status: "PENDING",
        resolutionNote: null,
        reviewedAt: null,
        createdAt: new Date(),
        violations: [{ type: "NO_SHOW_OR_ABSENCE" }],
        class: null,
        reportedTutorProfile: { user: { anonymousId: "TUT-0007" } },
      },
    ]);
  });

  it("401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "A1", role: "ADMIN" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only the caller's reports", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterId: "L1" } })
    );
    const body = await res.json();
    expect(body.reports[0].target.anonymousId).toBe("TUT-0007");
  });
});
