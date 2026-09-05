import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, chatbotMissFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  chatbotMissFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { chatbotMiss: { findMany: chatbotMissFindMany } },
}));

import { GET } from "@/app/api/admin/chatbot-misses/route";

const makeRequest = (query = "") => new NextRequest(`http://localhost/api/admin/chatbot-misses${query}`);

describe("GET /api/admin/chatbot-misses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatbotMissFindMany.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session user is not an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("groups near-identical rows and returns a paginated payload", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    chatbotMissFindMany.mockResolvedValue([
      { message: "How do I enrol?", role: "STUDENT_LEARNER", createdAt: "2026-09-01T00:00:00Z" },
      { message: "how do i enrol", role: "STUDENT_LEARNER", createdAt: "2026-09-02T00:00:00Z" },
    ]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.groups).toHaveLength(1);
    expect(json.groups[0].count).toBe(2);
    expect(json.total).toBe(1);
    expect(chatbotMissFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("applies a role filter", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    chatbotMissFindMany.mockResolvedValue([
      { message: "a", role: "STUDENT_LEARNER", createdAt: "2026-09-01T00:00:00Z" },
      { message: "b", role: "STUDENT_TUTOR", createdAt: "2026-09-01T00:00:00Z" },
    ]);

    const res = await GET(makeRequest("?role=STUDENT_TUTOR"));
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.groups[0].role).toBe("STUDENT_TUTOR");
  });

  it("sorts by count", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    chatbotMissFindMany.mockResolvedValue([
      { message: "popular", role: "ADMIN", createdAt: "2026-09-01T00:00:00Z" },
      { message: "popular", role: "ADMIN", createdAt: "2026-09-02T00:00:00Z" },
      { message: "rare", role: "ADMIN", createdAt: "2026-09-10T00:00:00Z" },
    ]);

    const res = await GET(makeRequest("?sort=count&dir=desc"));
    const json = await res.json();
    expect(json.groups[0].sample).toBe("popular");
  });

  it("paginates the grouped results", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    chatbotMissFindMany.mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => ({
        message: `unique ${i}`,
        role: "ADMIN",
        createdAt: "2026-09-01T00:00:00Z",
      }))
    );

    const res = await GET(makeRequest("?page=2&pageSize=2"));
    const json = await res.json();
    expect(json.groups).toHaveLength(1);
    expect(json.page).toBe(2);
    expect(json.total).toBe(3);
  });
});
