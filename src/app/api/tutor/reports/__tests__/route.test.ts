import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  userFindFirst,
  userFindMany,
  enrollmentFindFirst,
  reportFindFirst,
  reportFindMany,
  reportCreate,
  notificationCreateMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindFirst: vi.fn(),
  userFindMany: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  reportFindFirst: vi.fn(),
  reportFindMany: vi.fn(),
  reportCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: userFindFirst },
    classEnrollment: { findFirst: enrollmentFindFirst },
    report: { findFirst: reportFindFirst, findMany: reportFindMany },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        report: { create: reportCreate },
        user: { findMany: userFindMany },
        notification: { createMany: notificationCreateMany },
      }),
  },
}));

import { GET, POST } from "@/app/api/tutor/reports/route";

const tutor = { user: { id: "t1", role: "STUDENT_TUTOR", anonymousId: "TUT-0001" } };
const validBody = { targetId: "l1", violations: ["HARASSMENT_OR_BULLYING"] };
const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/tutor/reports", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  );

describe("POST /api/tutor/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(tutor);
    userFindFirst.mockResolvedValue({ anonymousId: "STU-0009" });
    enrollmentFindFirst.mockResolvedValue({ id: "e1" });
    reportFindFirst.mockResolvedValue(null);
    reportCreate.mockResolvedValue({ id: "r1" });
    userFindMany.mockResolvedValue([{ id: "admin1" }]);
  });

  it("returns 401 for a learner — learners cannot report learners", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l2", role: "STUDENT_LEARNER" } });
    expect((await post(validBody)).status).toBe(401);
  });

  it("returns 401 when signed out", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await post(validBody)).status).toBe(401);
  });

  it("returns 400 when no reason is ticked", async () => {
    expect((await post({ targetId: "l1", violations: [] })).status).toBe(400);
  });

  it("returns 400 for a reason that only applies to tutors", async () => {
    expect((await post({ targetId: "l1", violations: ["SOLICITING_PAYMENT"] })).status).toBe(400);
  });

  it("returns 400 when Other is ticked without a description", async () => {
    expect((await post({ targetId: "l1", violations: ["OTHER"], details: "short" })).status).toBe(400);
  });

  it("returns 404 when the target is not a learner", async () => {
    userFindFirst.mockResolvedValue(null);
    expect((await post(validBody)).status).toBe(404);
  });

  it("returns 403 when the learner was never in one of the tutor's classes", async () => {
    enrollmentFindFirst.mockResolvedValue(null);

    const res = await post(validBody);

    expect(res.status).toBe(403);
    expect(reportCreate).not.toHaveBeenCalled();
    expect(enrollmentFindFirst.mock.calls[0][0].where).toEqual({
      learnerId: "l1",
      class: { tutorProfile: { userId: "t1" } },
    });
  });

  it("returns 409 when an open report about the same learner exists", async () => {
    reportFindFirst.mockResolvedValue({ id: "existing" });
    expect((await post(validBody)).status).toBe(409);
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("creates the report against the learner and notifies the admins by anonymous ID only", async () => {
    const res = await post({ ...validBody, violations: ["HARASSMENT_OR_BULLYING", "HARASSMENT_OR_BULLYING", "OTHER"], details: "Kept insulting classmates." });

    expect(res.status).toBe(201);
    expect(reportCreate.mock.calls[0][0].data).toMatchObject({
      reporterId: "t1",
      targetType: "LEARNER",
      reportedLearnerId: "l1",
      details: "Kept insulting classmates.",
      violations: { create: [{ type: "HARASSMENT_OR_BULLYING" }, { type: "OTHER" }] },
    });
    const notification = notificationCreateMany.mock.calls[0][0].data[0];
    expect(notification).toMatchObject({ userId: "admin1", type: "REPORT_NEW" });
    expect(notification.message).toBe("A tutor reported learner STU-0009.");
  });

  it("returns 500 when the write fails", async () => {
    reportCreate.mockRejectedValue(new Error("db down"));
    expect((await post(validBody)).status).toBe(500);
  });
});

describe("GET /api/tutor/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(tutor);
  });

  it("returns 401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    expect((await GET()).status).toBe(401);
  });

  it("lists only the caller's learner reports, exposing just the anonymous ID", async () => {
    reportFindMany.mockResolvedValue([
      {
        id: "r1",
        targetType: "LEARNER",
        details: null,
        status: "PENDING",
        resolutionNote: null,
        reviewedAt: null,
        createdAt: new Date("2026-12-01T00:00:00Z"),
        reviewedById: "admin1",
        violations: [{ type: "NO_SHOW_OR_ABSENCE" }],
        reportedLearner: { anonymousId: "STU-0009" },
      },
    ]);

    const json = await (await GET()).json();

    expect(reportFindMany.mock.calls[0][0].where).toEqual({ reporterId: "t1", targetType: "LEARNER" });
    expect(json.reports[0]).toMatchObject({
      target: { anonymousId: "STU-0009" },
      violations: ["NO_SHOW_OR_ABSENCE"],
    });
    expect(json.reports[0]).not.toHaveProperty("reviewedById");
  });
});
