import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, updateManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  updateManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { updateMany: updateManyMock, count: countMock } },
}));

import { POST } from "@/app/api/notifications/read/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/notifications/read", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/notifications/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 0 });
    countMock.mockResolvedValue(0);
  });

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("with no ids, marks all of the caller's unread notifications read", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: "U1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("with ids, marks only those notifications read", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await POST(makeRequest({ ids: ["n1", "n2"] }));
    expect(res.status).toBe(200);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: "U1", readAt: null, id: { in: ["n1", "n2"] } },
      data: { readAt: expect.any(Date) },
    });
  });
});
