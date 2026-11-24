import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, messageFindMany, messageCount } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  messageFindMany: vi.fn(),
  messageCount: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { contactMessage: { findMany: messageFindMany, count: messageCount } },
}));

import { GET } from "@/app/api/admin/contact-messages/route";

const get = (query = "") => GET(new NextRequest(`http://localhost/api/admin/contact-messages${query}`));

describe("GET /api/admin/contact-messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    messageFindMany.mockResolvedValue([{ id: "m1" }]);
    messageCount.mockResolvedValue(3);
  });

  it("returns 401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    expect((await get()).status).toBe(401);
  });

  it("returns a page of messages with per-status counts", async () => {
    const json = await (await get("?status=OPEN")).json();

    expect(json).toMatchObject({ messages: [{ id: "m1" }], total: 3, page: 1, counts: { OPEN: 3, RESOLVED: 3 } });
    expect(messageFindMany.mock.calls[0][0].where).toEqual({ status: "OPEN" });
  });

  it("ignores an unknown status filter", async () => {
    await get("?status=DELETED");
    expect(messageFindMany.mock.calls[0][0].where).toEqual({});
  });

  it("paginates and caps the page size", async () => {
    await get("?page=3&pageSize=9999");
    expect(messageFindMany.mock.calls[0][0]).toMatchObject({ skip: 100, take: 50 });
  });

  it("returns 500 when the query fails", async () => {
    messageFindMany.mockRejectedValue(new Error("db down"));
    expect((await get()).status).toBe(500);
  });
});
