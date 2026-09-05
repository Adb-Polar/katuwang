import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classEnrollmentFindUnique, classSessionFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classEnrollmentFindUnique: vi.fn(),
  classSessionFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    classEnrollment: { findUnique: classEnrollmentFindUnique },
    classSession: { findMany: classSessionFindMany },
  },
}));

import { GET } from "@/app/api/learner/classes/[classId]/session-tests/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const ctx = () => ({ params: Promise.resolve({ classId: "c1" }) });
const getReq = () => new NextRequest("http://localhost/x");

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  classEnrollmentFindUnique.mockResolvedValue({ id: "e1" });
  classSessionFindMany.mockResolvedValue([]);
});

describe("GET /api/learner/classes/[classId]/session-tests", () => {
  it("401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_TUTOR" } });
    expect((await GET(getReq(), ctx())).status).toBe(401);
  });

  it("403 when not enrolled", async () => {
    classEnrollmentFindUnique.mockResolvedValue(null);
    expect((await GET(getReq(), ctx())).status).toBe(403);
  });

  it("a DRAFT test is reported as no test at all", async () => {
    classSessionFindMany.mockResolvedValue([
      {
        id: "s1",
        topic: "Fractions",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        test: { id: "st1", title: "t", status: "DRAFT", attempts: [] },
      },
    ]);
    const json = await (await GET(getReq(), ctx())).json();
    expect(json.sessions[0].test).toBeNull();
    expect(json.sessions[0].pre).toBeNull();
    expect(json.sessions[0].post).toBeNull();
  });

  it("surfaces the learner's own PRE/POST attempt status", async () => {
    classSessionFindMany.mockResolvedValue([
      {
        id: "s1",
        topic: "Fractions",
        scheduledAt: new Date(),
        status: "COMPLETED",
        test: {
          id: "st1",
          title: "t",
          status: "PUBLISHED",
          attempts: [
            { kind: "PRE", status: "SUBMITTED", scorePercent: 40, submittedAt: new Date() },
          ],
        },
      },
    ]);
    const json = await (await GET(getReq(), ctx())).json();
    expect(json.sessions[0].test).toEqual({ id: "st1", title: "t", status: "PUBLISHED" });
    expect(json.sessions[0].pre.scorePercent).toBe(40);
    expect(json.sessions[0].post).toBeNull();
  });
});
