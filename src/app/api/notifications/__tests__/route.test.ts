import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/notifications/route";

const req = (url = "http://localhost/api/notifications") => new Request(url);

describe("GET /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("returns only the caller's notifications with unreadCount", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    findManyMock.mockResolvedValue([{ id: "n1", type: "TOPIC_REQUEST_ACCEPTED", message: "hi", link: null, readAt: null, createdAt: new Date() }]);
    countMock.mockResolvedValue(1);

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "U1" }, take: 50 })
    );
    expect(countMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "U1", readAt: null } })
    );
    const json = await res.json();
    expect(json.unreadCount).toBe(1);
    expect(json.notifications).toHaveLength(1);
  });

  it("clamps ?take to the 1..50 range", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await GET(req("http://localhost/api/notifications?take=8"));
    expect(findManyMock).toHaveBeenLastCalledWith(expect.objectContaining({ take: 8 }));

    await GET(req("http://localhost/api/notifications?take=999"));
    expect(findManyMock).toHaveBeenLastCalledWith(expect.objectContaining({ take: 50 }));
  });
});
