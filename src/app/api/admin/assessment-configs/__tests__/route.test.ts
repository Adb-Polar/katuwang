import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, upsertMock, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  upsertMock: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicAssessmentConfig: { upsert: upsertMock },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        topicAssessmentConfig: { upsert: upsertMock },
        auditLog: { create: auditLogCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/assessment-configs/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/assessment-configs", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/admin/assessment-configs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(req({ subject: "MATH", topic: "Algebraic Expressions", passPercent: 70 }));
    expect(res.status).toBe(401);
  });

  it("400 when passPercent is out of range", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ subject: "MATH", topic: "Algebraic Expressions", passPercent: 250 }));
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("400 when the topic is not valid for the subject", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ subject: "MATH", topic: "Nope", passPercent: 70 }));
    expect(res.status).toBe(400);
  });

  it("upserts the config and writes an audit row", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    upsertMock.mockResolvedValue({ id: "cfg1", subject: "MATH", topic: "Algebraic Expressions", passPercent: 70 });

    const res = await PATCH(
      req({ subject: "MATH", topic: "Algebraic Expressions", questionCount: 6, passPercent: 70, minBankSize: 8 })
    );
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subject_topic: { subject: "MATH", topic: "Algebraic Expressions" } },
        update: expect.objectContaining({ questionCount: 6, passPercent: 70, minBankSize: 8, updatedById: "A1" }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "ASSESSMENT_CONFIG_UPDATED" }) })
    );
  });
});
