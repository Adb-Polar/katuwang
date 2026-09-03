import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, upsertMock, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  upsertMock: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformSetting: { findMany: findManyMock, upsert: upsertMock },
    auditLog: { create: auditLogCreate },
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

import { GET, PATCH } from "@/app/api/admin/assessment-configs/route";

const admin = { user: { id: "A1", role: "ADMIN" } };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/assessment-configs", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/admin/assessment-configs (global)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    upsertMock.mockResolvedValue({});
    auditLogCreate.mockResolvedValue({});
  });

  it("GET 401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns the resolved config", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    findManyMock.mockResolvedValue([
      { key: "assessmentQuestionCount", value: "7" },
      { key: "assessmentPassPercent", value: "75" },
      { key: "assessmentMinBankSize", value: "9" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ questionCount: 7, passPercent: 75, minBankSize: 9 });
  });

  it("PATCH 401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(req({ passPercent: 70 }));
    expect(res.status).toBe(401);
  });

  it("PATCH 400 when passPercent is out of range", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ passPercent: 250 }));
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("PATCH 400 when no field is provided", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({}));
    expect(res.status).toBe(400);
  });

  it("PATCH upserts only the provided keys and writes an audit row", async () => {
    getServerSessionMock.mockResolvedValue(admin);
    const res = await PATCH(req({ questionCount: 6, minBankSize: 8 }));
    expect(res.status).toBe(200);

    const upsertedKeys = upsertMock.mock.calls.map((c) => (c[0] as { where: { key: string } }).where.key);
    expect(upsertedKeys).toEqual(["assessmentQuestionCount", "assessmentMinBankSize"]);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "assessmentQuestionCount" },
        update: { value: "6" },
        create: { key: "assessmentQuestionCount", value: "6" },
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "ASSESSMENT_CONFIG_UPDATED", targetId: "global" }) })
    );
  });
});
