import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock, getSettingMock, reinstateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  getSettingMock: vi.fn(),
  reinstateMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: findManyMock, count: countMock } } }));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
vi.mock("@/lib/moderation", () => ({ reinstateExpiredClasses: reinstateMock }));

import { GET } from "@/app/api/learner/tutors/route";

const learner = { user: { id: "L1", role: "STUDENT_LEARNER" } };
const req = (url = "http://localhost/api/learner/tutors") => new NextRequest(url, { method: "GET" });

describe("GET /api/learner/tutors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
    countMock.mockResolvedValue(1);
    reinstateMock.mockResolvedValue(undefined);
    findManyMock.mockResolvedValue([
      {
        id: "u1",
        anonymousId: "TUT-0148",
        tutorProfile: {
          topicCertifications: [
            { subject: "MATH", topic: "Linear equations" },
            { subject: "MATH", topic: "Fractions" },
            { subject: "SCIENCE", topic: "Forces" },
          ],
          _count: { classes: 2 },
          classes: [
            { sessions: [{ scheduledAt: new Date("2999-01-02T08:00:00Z") }] },
            { sessions: [{ scheduledAt: new Date("2999-01-01T08:00:00Z") }] },
          ],
        },
      },
    ]);
  });

  it("401 for a non-learner", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
    expect((await GET(req())).status).toBe(401);
  });

  it("returns anonymized, aggregated tutor rows", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const res = await GET(req());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.tutors[0]).toMatchObject({
      id: "u1",
      anonymousId: "TUT-0148",
      verifiedTopicCount: 3,
      subjects: ["MATH", "SCIENCE"],
      publishedClassCount: 2,
      nextSessionAt: "2999-01-01T08:00:00.000Z",
    });
    expect(json.tutors[0].name).toBeUndefined();
  });

  it("passes the subject filter into the certification where clause", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(req("http://localhost/api/learner/tutors?subject=SCIENCE"));
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.tutorProfile.topicCertifications.some).toMatchObject({
      status: "CERTIFIED",
      subject: "SCIENCE",
    });
  });

  it("includes the real name only when showTutorRealNames is on", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    getSettingMock.mockResolvedValue(true);
    findManyMock.mockResolvedValue([
      {
        id: "u1",
        anonymousId: "TUT-0148",
        firstName: "Ana",
        lastName: "Cruz",
        section: "Rizal",
        tutorProfile: { topicCertifications: [], _count: { classes: 0 }, classes: [] },
      },
    ]);
    const json = await (await GET(req())).json();
    expect(json.tutors[0].name).toBe("Ana Cruz");
  });
});
