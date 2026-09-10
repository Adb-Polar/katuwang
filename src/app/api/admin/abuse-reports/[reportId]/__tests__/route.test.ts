import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, reportFindUnique, reportUpdate, auditCreate, notificationCreate } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    reportFindUnique: vi.fn(),
    reportUpdate: vi.fn(),
    auditCreate: vi.fn(),
    notificationCreate: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    report: { findUnique: reportFindUnique },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        report: { update: reportUpdate },
        auditLog: { create: auditCreate },
        notification: { create: notificationCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/abuse-reports/[reportId]/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const params = { params: Promise.resolve({ reportId: "r1" }) };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/abuse-reports/r1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const pendingReport = {
  id: "r1",
  status: "PENDING",
  reporterId: "L1",
  targetType: "TUTOR",
  class: null,
  reportedTutorProfile: { user: { anonymousId: "TUT-0007" } },
};

describe("PATCH /api/admin/abuse-reports/[reportId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportFindUnique.mockResolvedValue(pendingReport);
    reportUpdate.mockResolvedValue({ id: "r1", status: "RESOLVED" });
  });

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(req({ decision: "RESOLVE" }), params);
    expect(res.status).toBe(401);
  });

  it("404 when the report is missing", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    reportFindUnique.mockResolvedValue(null);
    const res = await PATCH(req({ decision: "RESOLVE" }), params);
    expect(res.status).toBe(404);
  });

  it("400 when the report is already reviewed", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    reportFindUnique.mockResolvedValue({ ...pendingReport, status: "RESOLVED" });
    const res = await PATCH(req({ decision: "RESOLVE" }), params);
    expect(res.status).toBe(400);
  });

  it("400 on an invalid decision", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "MAYBE" }), params);
    expect(res.status).toBe(400);
  });

  it("RESOLVE records the decision, writes an audit row and notifies the reporter", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "RESOLVE", resolutionNote: "Warned the tutor." }), params);
    expect(res.status).toBe(200);
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RESOLVED", reviewedById: "A1" }),
      })
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "REPORT_RESOLVED", targetType: "REPORT", targetId: "r1" }),
      })
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "L1", type: "REPORT_REVIEWED" }),
      })
    );
  });

  it("DISMISS records a dismissal", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ decision: "DISMISS" }), params);
    expect(res.status).toBe(200);
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DISMISSED" }) })
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "REPORT_DISMISSED" }) })
    );
  });
});
