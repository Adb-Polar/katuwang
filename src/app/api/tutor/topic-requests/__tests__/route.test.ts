import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  topicCertFindMany,
  topicRequestCount,
  topicRequestFindMany,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  topicCertFindMany: vi.fn(),
  topicRequestCount: vi.fn(),
  topicRequestFindMany: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicCertification: { findMany: topicCertFindMany },
    topicRequest: { count: topicRequestCount, findMany: topicRequestFindMany },
  },
}));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import { GET } from "@/app/api/tutor/topic-requests/route";

const tutor = { user: { id: "T1", role: "STUDENT_TUTOR" } };

function req(url = "http://localhost/api/tutor/topic-requests") {
  return new NextRequest(url);
}

describe("GET /api/tutor/topic-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicCertFindMany.mockResolvedValue([{ subject: "MATH", topic: "Algebraic Expressions" }]);
    topicRequestCount.mockResolvedValue(1);
    topicRequestFindMany.mockResolvedValue([
      {
        id: "r1",
        subject: "MATH",
        gradeLevel: "GRADE_9",
        note: null,
        createdAt: new Date(),
        topics: [{ topic: "Algebraic Expressions" }],
        slots: [],
        learner: { anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "Rizal" },
        directedTutorProfileId: null,
      },
    ]);
  });

  it("401 for non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } });
    expect((await GET(req())).status).toBe(401);
  });

  it("403 when matching disabled", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    getSettingMock.mockResolvedValue(false);
    expect((await GET(req())).status).toBe(403);
  });

  it("404 when the tutor has no profile", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorProfileFindUnique.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(404);
  });

  it("tab=open returns anonymized requests scoped to the tutor's certified pool, directed flagged", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await GET(req("http://localhost/api/tutor/topic-requests?tab=open"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.requests[0].learner).toEqual({ anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "Rizal" });
    expect(json.requests[0].topics).toEqual(["Algebraic Expressions"]);
    expect(json.requests[0].directed).toBe(false);
    expect(topicRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "OPEN" }),
      })
    );
  });

  it("tab=open flags a request directed at this tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicRequestFindMany.mockResolvedValue([
      {
        id: "r1",
        subject: "MATH",
        gradeLevel: "GRADE_9",
        note: null,
        createdAt: new Date(),
        topics: [{ topic: "Algebraic Expressions" }],
        slots: [],
        learner: { anonymousId: "STU-0001", gradeLevel: "GRADE_9", section: "Rizal" },
        directedTutorProfileId: "tp1",
      },
    ]);
    const res = await GET(req());
    const json = await res.json();
    expect(json.requests[0].directed).toBe(true);
  });

  it("filters open requests by an explicit subject query param", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    await GET(req("http://localhost/api/tutor/topic-requests?tab=open&subject=SCIENCE"));
    expect(topicRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subject: "SCIENCE" }) })
    );
  });

  it("tab=accepted scopes to requests accepted into this tutor's classes", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicRequestFindMany.mockResolvedValue([
      {
        id: "r2",
        subject: "MATH",
        gradeLevel: "GRADE_9",
        status: "ACCEPTED",
        topics: [{ topic: "Algebraic Expressions" }],
        learner: { anonymousId: "STU-0002", gradeLevel: "GRADE_9", section: "Luna" },
        fulfilledClass: { id: "c1", sessions: [], _count: { enrollments: 0 }, maxStudents: 3 },
      },
    ]);

    const res = await GET(req("http://localhost/api/tutor/topic-requests?tab=accepted"));
    expect(res.status).toBe(200);
    expect(topicRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["ACCEPTED", "ENROLLED"] },
          fulfilledClass: { tutorProfileId: "tp1" },
        }),
      })
    );
    const json = await res.json();
    expect(json.requests[0].class).toEqual({ id: "c1", nextSessionAt: null, enrolledCount: 0, maxStudents: 3 });
  });
});
