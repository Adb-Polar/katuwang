import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock, getSettingMock, reinstateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  getSettingMock: vi.fn(),
  reinstateMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: {
    subject: { findMany: vi.fn(async () => (await import("@/test/catalogFixture")).catalogFixture()) }, user: { findMany: findManyMock, count: countMock } } }));
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
            {
              code: "C-0001",
              subject: "MATH",
              topics: [{ topic: "Linear equations" }],
              sessions: [{ scheduledAt: new Date("2999-01-02T08:00:00Z") }],
            },
            {
              code: "C-0002",
              subject: "SCIENCE",
              topics: [{ topic: "Forces" }],
              sessions: [{ scheduledAt: new Date("2999-01-01T08:00:00Z") }],
            },
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
      verifiedTopics: [
        { subject: "MATH", topic: "Linear equations" },
        { subject: "MATH", topic: "Fractions" },
        { subject: "SCIENCE", topic: "Forces" },
      ],
      subjects: ["MATH", "SCIENCE"],
      verifiedClasses: [
        { code: "C-0001", subject: "MATH" },
        { code: "C-0002", subject: "SCIENCE" },
      ],
      publishedClassCount: 2,
      nextSessionAt: "2999-01-01T08:00:00.000Z",
    });
    expect(json.tutors[0].name).toBeUndefined();
    expect(findManyMock.mock.calls[0][0].select.tutorProfile.select.topicCertifications.where).toEqual({ status: "CERTIFIED" });
  });

  it("legacy single ?subject= filters to a CERTIFIED cert in that subject", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(req("http://localhost/api/learner/tutors?subject=SCIENCE"));
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.tutorProfile.AND).toEqual([
      { topicCertifications: { some: { status: "CERTIFIED", subject: "SCIENCE" } } },
    ]);
  });

  it("multi-select ?subjects= ANDs one CERTIFIED clause per subject", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(req("http://localhost/api/learner/tutors?subjects=MATH,SCIENCE"));
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.tutorProfile.AND).toEqual([
      { topicCertifications: { some: { status: "CERTIFIED", subject: "MATH" } } },
      { topicCertifications: { some: { status: "CERTIFIED", subject: "SCIENCE" } } },
    ]);
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

  it("does not implicitly filter tutor grades for a learner", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "L1", role: "STUDENT_LEARNER", gradeLevel: "GRADE_10" },
    });
    await GET(req());
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.gradeLevel).toBeUndefined();
  });

  it.each(["Maria", "Santos", "Maria Luisa Santos", "  Maria   Santos  "])("searches visible tutor names for %s and retains verification filters", async q => {
    getServerSessionMock.mockResolvedValue(learner);
    getSettingMock.mockResolvedValue(true);
    const json = await (await GET(req(`http://localhost/api/learner/tutors?q=${encodeURIComponent(q)}&subject=MATH`))).json();
    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({ role: "STUDENT_TUTOR", status: "ACTIVE", tutorProfile: { AND: [{ topicCertifications: { some: { status: "CERTIFIED", subject: "MATH" } } }] },
      OR: [{ anonymousId: { contains: q.trim() } }, { AND: q.trim().split(/\s+/).map(word => ({ OR: [{ firstName: { contains: word } }, { lastName: { contains: word } }] })) }] });
    expect(countMock.mock.calls[0][0].where).toEqual(args.where);
    expect(json.showTutorRealNames).toBe(true);
  });

  it("does not query or select real names while name visibility is off", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const json = await (await GET(req("http://localhost/api/learner/tutors?q=Maria%20Santos"))).json();
    const args = findManyMock.mock.calls[0][0];
    expect(args.where.OR).toEqual([{ anonymousId: { contains: "Maria Santos" } }]);
    expect(args.select).not.toHaveProperty("firstName");
    expect(args.select).not.toHaveProperty("lastName");
    expect(json.showTutorRealNames).toBe(false);
    expect(json.tutors[0]).not.toHaveProperty("name");
  });

  it("returns grade level and section even while real names are hidden", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findManyMock.mockResolvedValue([
      {
        id: "u1",
        anonymousId: "TUT-0148",
        gradeLevel: "GRADE_10",
        section: "Rizal",
        tutorProfile: { topicCertifications: [], _count: { classes: 0 }, classes: [] },
      },
    ]);
    const json = await (await GET(req("http://localhost/api/learner/tutors"))).json();
    const { select } = findManyMock.mock.calls[0][0];
    expect(select).toMatchObject({ gradeLevel: true, section: true });
    expect(json.tutors[0]).toMatchObject({ gradeLevel: "GRADE_10", section: "Rizal" });
    expect(json.tutors[0]).not.toHaveProperty("name");
    for (const field of ["email", "contactInfo", "studentIdNumber", "adviserTeacherName"]) {
      expect(select).not.toHaveProperty(field);
      expect(json.tutors[0]).not.toHaveProperty(field);
    }
  });
});
