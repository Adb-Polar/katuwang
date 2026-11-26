import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  session: vi.fn(),
  userFindFirst: vi.fn(),
  userFindMany: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  reportFindFirst: vi.fn(),
  reportFindMany: vi.fn(),
  reportCreate: vi.fn(),
  notifyMany: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: m.session }));
vi.mock("@/lib/notifications", () => ({ notifyMany: m.notifyMany }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: m.userFindFirst },
    classEnrollment: { findFirst: m.enrollmentFindFirst },
    report: { findFirst: m.reportFindFirst, findMany: m.reportFindMany },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ report: { create: m.reportCreate }, user: { findMany: m.userFindMany } }),
  },
}));

import { GET, POST } from "@/app/api/tutor/reports/route";

const tutor = { user: { id: "tutorU1", role: "STUDENT_TUTOR" } };
const valid = { targetType: "LEARNER", targetId: "L1", violations: ["DISRUPTIVE_BEHAVIOR"], details: "" };
const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/tutor/reports", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.session.mockResolvedValue(tutor);
  m.userFindFirst.mockResolvedValue({ id: "L1", anonymousId: "STU-0007" });
  m.enrollmentFindFirst.mockResolvedValue({ id: "e1" });
  m.reportFindFirst.mockResolvedValue(null);
  m.reportCreate.mockResolvedValue({ id: "r1", status: "PENDING", createdAt: new Date() });
  m.userFindMany.mockResolvedValue([{ id: "admin1" }, { id: "super1" }]);
});

describe("POST /api/tutor/reports", () => {
  it("401 when unauthenticated", async () => {
    m.session.mockResolvedValue(null);
    expect((await post(valid)).status).toBe(401);
  });

  it.each(["STUDENT_LEARNER", "ADMIN"])("401 for a %s", async (role) => {
    m.session.mockResolvedValue({ user: { id: "x", role } });
    expect((await post(valid)).status).toBe(401);
    expect(m.reportCreate).not.toHaveBeenCalled();
  });

  it("201 files the report against the learner and notifies every active admin", async () => {
    const res = await post({ ...valid, violations: ["DISRUPTIVE_BEHAVIOR", "DISRUPTIVE_BEHAVIOR", "REPEATED_ABSENCE"], details: "  Talks over others.  " });
    expect(res.status).toBe(201);
    expect(m.reportCreate.mock.calls[0][0].data).toEqual({
      reporterId: "tutorU1",
      targetType: "LEARNER",
      reportedLearnerId: "L1",
      details: "Talks over others.",
      violations: { create: [{ type: "DISRUPTIVE_BEHAVIOR" }, { type: "REPEATED_ABSENCE" }] },
    });
    expect(m.notifyMany).toHaveBeenCalledWith(
      expect.anything(), ["admin1", "super1"], "REPORT_NEW", "A tutor reported learner STU-0007.", "/admin/abuse-reports"
    );
  });

  it("checks standing against the tutor's own classes", async () => {
    await post(valid);
    expect(m.enrollmentFindFirst.mock.calls[0][0].where).toEqual({
      learnerId: "L1",
      class: { tutorProfile: { userId: "tutorU1" } },
    });
  });

  it("403 for a learner who never joined one of the tutor's classes", async () => {
    m.enrollmentFindFirst.mockResolvedValue(null);
    const res = await post(valid);
    expect(res.status).toBe(403);
    expect(m.reportCreate).not.toHaveBeenCalled();
  });

  it("404 when the target is not a learner", async () => {
    m.userFindFirst.mockResolvedValue(null);
    expect((await post(valid)).status).toBe(404);
    expect(m.userFindFirst.mock.calls[0][0].where).toEqual({ id: "L1", role: "STUDENT_LEARNER" });
  });

  it("409 while an earlier report about the same learner is still pending", async () => {
    m.reportFindFirst.mockResolvedValue({ id: "r0" });
    const res = await post(valid);
    expect(res.status).toBe(409);
    expect(m.reportFindFirst.mock.calls[0][0].where).toEqual({ reporterId: "tutorU1", status: "PENDING", reportedLearnerId: "L1" });
    expect(m.reportCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["no reason", { ...valid, violations: [] }],
    ["a tutor-only reason", { ...valid, violations: ["SOLICITING_PAYMENT"] }],
    ["Other without a description", { ...valid, violations: ["OTHER"], details: "short" }],
    ["a tutor target", { ...valid, targetType: "TUTOR" }],
    ["a missing target", { ...valid, targetId: "" }],
    ["an over-long description", { ...valid, details: "x".repeat(1001) }],
  ])("400 for %s", async (_label, body) => {
    expect((await post(body)).status).toBe(400);
    expect(m.reportCreate).not.toHaveBeenCalled();
  });

  it("accepts Other with a description of 10 characters", async () => {
    expect((await post({ ...valid, violations: ["OTHER"], details: "1234567890" })).status).toBe(201);
  });

  it("500 when the database fails", async () => {
    m.reportCreate.mockRejectedValue(new Error("db down"));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("An unexpected error occurred. Please try again.");
  });
});

describe("GET /api/tutor/reports", () => {
  it("401 for a non-tutor", async () => {
    m.session.mockResolvedValue({ user: { id: "x", role: "STUDENT_LEARNER" } });
    expect((await GET()).status).toBe(401);
  });

  it("returns only the tutor's own learner reports, by anonymous ID", async () => {
    m.reportFindMany.mockResolvedValue([
      {
        id: "r1", details: null, status: "RESOLVED", resolutionNote: "Spoken to.", reviewedAt: new Date("2026-12-02T00:00:00Z"),
        createdAt: new Date("2026-12-01T00:00:00Z"), violations: [{ type: "DISRUPTIVE_BEHAVIOR" }], reportedLearner: { anonymousId: "STU-0007" },
      },
    ]);
    const { reports } = await (await GET()).json();
    const { where, select } = m.reportFindMany.mock.calls[0][0];
    expect(where).toEqual({ reporterId: "tutorU1", targetType: "LEARNER" });
    expect(reports[0]).toMatchObject({ targetType: "LEARNER", target: { anonymousId: "STU-0007" }, violations: ["DISRUPTIVE_BEHAVIOR"], status: "RESOLVED" });
    // Double-blind: no learner identity beyond the anonymous ID, and no reviewer.
    expect(select.reportedLearner).toEqual({ select: { anonymousId: true } });
    expect(select).not.toHaveProperty("reviewedBy");
    expect(JSON.stringify(reports)).not.toMatch(/firstName|lastName|email/);
  });

  it("500 when the database fails", async () => {
    m.reportFindMany.mockRejectedValue(new Error("db down"));
    expect((await GET()).status).toBe(500);
  });
});
