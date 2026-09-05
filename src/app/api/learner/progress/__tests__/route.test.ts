import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classEnrollmentFindMany } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classEnrollmentFindMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { classEnrollment: { findMany: classEnrollmentFindMany } },
}));

import { GET } from "@/app/api/learner/progress/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const getReq = (qs = "") => new NextRequest(`http://localhost/api/learner/progress${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(learner);
  classEnrollmentFindMany.mockResolvedValue([]);
});

describe("GET /api/learner/progress", () => {
  it("401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_TUTOR" } });
    expect((await GET(getReq())).status).toBe(401);
  });

  it("filters by classId when given", async () => {
    await GET(getReq("?classId=c1"));
    expect(classEnrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ learnerId: "L1", classId: "c1" }) }),
    );
  });

  it("carries only classCode/subject/topic/scheduledAt — no tutor identity, no class average", async () => {
    classEnrollmentFindMany.mockResolvedValue([
      {
        class: {
          code: "C-0001",
          subject: "MATH",
          sessions: [
            {
              id: "s1",
              topic: "Fractions",
              scheduledAt: new Date("2026-09-01T00:00:00Z"),
              status: "COMPLETED",
              test: {
                status: "PUBLISHED",
                attempts: [
                  { kind: "PRE", scorePercent: 40, status: "SUBMITTED" },
                  { kind: "POST", scorePercent: 70, status: "SUBMITTED" },
                ],
              },
            },
          ],
        },
      },
    ]);

    const json = await (await GET(getReq())).json();
    expect(json.series).toEqual([
      {
        classCode: "C-0001",
        subject: "MATH",
        topic: "Fractions",
        scheduledAt: "2026-09-01T00:00:00.000Z",
        preScore: 40,
        postScore: 70,
        delta: 30,
      },
    ]);
    expect(JSON.stringify(json)).not.toMatch(/tutor/i);
    expect(json.summary).toEqual({ sessionsWithTest: 1, pairedCount: 1, avgDelta: 30 });
  });

  it("skips sessions with a DRAFT (or no) test", async () => {
    classEnrollmentFindMany.mockResolvedValue([
      {
        class: {
          code: "C-0001",
          subject: "MATH",
          sessions: [
            { id: "s1", topic: "Fractions", scheduledAt: new Date(), status: "SCHEDULED", test: { status: "DRAFT", attempts: [] } },
            { id: "s2", topic: "Decimals", scheduledAt: new Date(), status: "SCHEDULED", test: null },
          ],
        },
      },
    ]);
    const json = await (await GET(getReq())).json();
    expect(json.series).toEqual([]);
  });
});
