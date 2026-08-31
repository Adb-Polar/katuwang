import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, topicCertificationFindMany, topicCertificationCount } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  topicCertificationFindMany: vi.fn(),
  topicCertificationCount: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    topicCertification: { findMany: topicCertificationFindMany, count: topicCertificationCount },
  },
}));

import { GET } from "@/app/api/admin/certifications/route";
import { NextRequest } from "next/server";

const makeRequest = (query = "") => new NextRequest(`http://localhost/api/admin/certifications${query}`);

describe("GET /api/admin/certifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    topicCertificationCount.mockResolvedValue(1);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session user is not an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns a paginated payload with tutor identity flattened (defaults to PENDING)", async () => {
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

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.certifications).toHaveLength(1);
    expect(json.certifications[0].tutor).toEqual({
      id: "u1",
      anonymousId: "TUT-0001",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
    expect(json.certifications[0].tutorProfile).toBeUndefined();
    expect(topicCertificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PENDING" }) })
    );
  });

  it("lists REJECTED certifications ordered by review date", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindMany.mockResolvedValue([]);

    await GET(makeRequest("?status=REJECTED"));

    expect(topicCertificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "REJECTED" }),
        orderBy: { reviewedAt: "desc" },
      })
    );
  });

  it("filters by status=CERTIFIED, subject and q", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    topicCertificationFindMany.mockResolvedValue([]);

    await GET(makeRequest("?status=CERTIFIED&subject=MATH&q=alg"));

    expect(topicCertificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "CERTIFIED",
          subject: "MATH",
          OR: [
            { topic: { contains: "alg" } },
            { tutorProfile: { user: { anonymousId: { contains: "alg" } } } },
          ],
        },
      })
    );
  });
});
