import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classFindUnique, classUpdate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindUnique: vi.fn(),
  classUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: classFindUnique, update: classUpdate },
  },
}));

import { PATCH } from "@/app/api/admin/classes/[classId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/classes/c1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, classId = "c1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ classId }) });
}

describe("PATCH /api/admin/classes/[classId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the class doesn't exist", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue(null);
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when suspending a non-scheduled class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "COMPLETED" });
    const res = await patch({ status: "SUSPENDED" });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when reinstating a non-suspended class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(400);
    expect(classUpdate).not.toHaveBeenCalled();
  });

  it("suspends a scheduled class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SUSPENDED", suspendedReason: "Policy violation" });

    const res = await patch({ status: "SUSPENDED", reason: "Policy violation" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { status: "SUSPENDED", suspendedReason: "Policy violation" },
      })
    );
  });

  it("reinstates a suspended class", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    classFindUnique.mockResolvedValue({ id: "c1", status: "SUSPENDED" });
    classUpdate.mockResolvedValue({ id: "c1", status: "SCHEDULED", suspendedReason: null });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(200);
    expect(classUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { status: "SCHEDULED", suspendedReason: null },
      })
    );
  });
});
