import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, topicCertificationFindUnique, topicCertificationUpdate, topicCertificationDelete, auditLogCreate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  topicCertificationFindUnique: vi.fn(),
  topicCertificationUpdate: vi.fn(),
  topicCertificationDelete: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicCertification: {
      findUnique: topicCertificationFindUnique,
      update: topicCertificationUpdate,
      delete: topicCertificationDelete,
    },
    auditLog: { create: auditLogCreate },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        topicCertification: { update: topicCertificationUpdate, delete: topicCertificationDelete },
        auditLog: { create: auditLogCreate },
      }),
  },
}));

import { PATCH } from "@/app/api/admin/certifications/[certificationId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/certifications/c1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, certificationId = "c1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ certificationId }) });
}

describe("PATCH /api/admin/certifications/[certificationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await patch({ status: "CERTIFIED" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the certification doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindUnique.mockResolvedValue(null);
    const res = await patch({ status: "CERTIFIED" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when the certification is no longer pending", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindUnique.mockResolvedValue({ id: "c1", status: "CERTIFIED" });
    const res = await patch({ status: "CERTIFIED" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid decision", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindUnique.mockResolvedValue({ id: "c1", status: "PENDING" });
    const res = await patch({ status: "NOT_A_STATUS" });
    expect(res.status).toBe(400);
  });

  it("certifies a pending request and sets certifiedAt", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindUnique.mockResolvedValue({ id: "c1", status: "PENDING" });
    topicCertificationUpdate.mockResolvedValue({ id: "c1", status: "CERTIFIED", certifiedAt: new Date().toISOString() });

    const res = await patch({ status: "CERTIFIED" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("CERTIFIED");
    expect(topicCertificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({ status: "CERTIFIED" }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "CERTIFICATION_APPROVED",
          targetType: "CERTIFICATION",
          targetId: "c1",
        }),
      })
    );
  });

  it("rejects a pending request by deleting it", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindUnique.mockResolvedValue({ id: "c1", status: "PENDING" });
    topicCertificationDelete.mockResolvedValue({ id: "c1", status: "PENDING" });

    const res = await patch({ status: "REJECTED" });
    expect(res.status).toBe(200);
    expect(topicCertificationDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(topicCertificationUpdate).not.toHaveBeenCalled();
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: "admin1",
          action: "CERTIFICATION_REJECTED",
          targetType: "CERTIFICATION",
          targetId: "c1",
        }),
      })
    );
  });
});
