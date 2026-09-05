import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, tutorProfileFindUnique, tutorClassFindUnique } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  tutorClassFindUnique: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
  },
}));

import { GET } from "@/app/api/tutor/classes/[classId]/test-results/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1" }) });
const getReq = () => new NextRequest("http://localhost/api/tutor/classes/c1/test-results");

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
});

describe("GET /api/tutor/classes/[classId]/test-results", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(401);
  });

  it("403 when the class belongs to another tutor", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "OTHER", status: "SCHEDULED" });
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("404 when the class doesn't exist", async () => {
    tutorClassFindUnique.mockResolvedValueOnce({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED" }); // loadOwnedClass
    tutorClassFindUnique.mockResolvedValueOnce(null); // buildClassSessionTestRollup's own lookup
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(404);
  });
});
