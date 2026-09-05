import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, tutorProfileFindUnique, tutorClassFindUnique, classSessionFindUnique, sessionTestFindUnique } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    tutorProfileFindUnique: vi.fn(),
    tutorClassFindUnique: vi.fn(),
    classSessionFindUnique: vi.fn(),
    sessionTestFindUnique: vi.fn(),
  }));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    tutorClass: { findUnique: tutorClassFindUnique },
    classSession: { findUnique: classSessionFindUnique },
    sessionTest: { findUnique: sessionTestFindUnique },
  },
}));

import { GET } from "@/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1", sessionId: "s1" }) });
const getReq = () =>
  new NextRequest("http://localhost/api/tutor/classes/c1/sessions/s1/test/results");

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
  tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "MATH", topics: [] });
  classSessionFindUnique.mockResolvedValue({ id: "s1", classId: "c1", status: "COMPLETED" });
});

describe("GET /test/results", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(401);
  });

  it("404 when there is no test yet", async () => {
    sessionTestFindUnique.mockResolvedValue(null);
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(404);
  });

  it("403 when the class belongs to another tutor", async () => {
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "OTHER", status: "SCHEDULED" });
    const res = await GET(getReq(), ctx());
    expect(res.status).toBe(403);
  });
});
