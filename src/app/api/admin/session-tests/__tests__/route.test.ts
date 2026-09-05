import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, sessionTestFindMany, sessionTestCount } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  sessionTestFindMany: vi.fn(),
  sessionTestCount: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { sessionTest: { findMany: sessionTestFindMany, count: sessionTestCount } },
}));

import { GET } from "@/app/api/admin/session-tests/route";

const admin = { user: { id: "A1", role: "ADMIN" } };
const getReq = (qs = "") => new NextRequest(`http://localhost/api/admin/session-tests${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(admin);
  sessionTestFindMany.mockResolvedValue([]);
  sessionTestCount.mockResolvedValue(0);
});

describe("GET /api/admin/session-tests", () => {
  it("401 for a non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_TUTOR" } });
    expect((await GET(getReq())).status).toBe(401);
  });

  it("flattens the session/class join into classCode/subject/sessionTopic/tutor", async () => {
    sessionTestFindMany.mockResolvedValue([
      {
        id: "st1",
        title: "Fractions check-in",
        status: "PUBLISHED",
        createdAt: new Date(),
        session: {
          scheduledAt: new Date("2026-09-01T00:00:00Z"),
          topic: "Fractions",
          status: "COMPLETED",
          class: {
            code: "C-0001",
            subject: "MATH",
            tutorProfile: { user: { id: "T1", anonymousId: "TUT-0001" } },
          },
        },
        _count: { questions: 3, attempts: 5 },
      },
    ]);
    sessionTestCount.mockResolvedValue(1);

    const json = await (await GET(getReq())).json();
    expect(json.tests[0]).toMatchObject({
      classCode: "C-0001",
      subject: "MATH",
      sessionTopic: "Fractions",
      tutor: { id: "T1", anonymousId: "TUT-0001" },
      questionCount: 3,
      attemptCount: 5,
    });
    expect(json.tests[0]).not.toHaveProperty("session");
  });
});
