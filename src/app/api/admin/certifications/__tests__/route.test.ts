import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, topicCertificationFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  topicCertificationFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicCertification: { findMany: topicCertificationFindMany },
  },
}));

import { GET } from "@/app/api/admin/certifications/route";

describe("GET /api/admin/certifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session user is not an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns pending certifications with tutor identity flattened", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindMany.mockResolvedValue([
      {
        id: "c1",
        subject: "MATH",
        topic: "Algebra",
        status: "PENDING",
        requestedAt: new Date().toISOString(),
        certifiedAt: null,
        tutorProfile: {
          user: { id: "u1", anonymousId: "TUT-0001", firstName: "Jane", lastName: "Doe", email: "jane@example.com" },
        },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].tutor).toEqual({ id: "u1", anonymousId: "TUT-0001", firstName: "Jane", lastName: "Doe", email: "jane@example.com" });
    expect(json[0].tutorProfile).toBeUndefined();
    expect(topicCertificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } })
    );
  });
});
