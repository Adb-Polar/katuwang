import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  findManyMock,
  countMock,
  updateManyMock,
  getSettingMock,
  userFindUniqueMock,
  enrollmentFindManyMock,
  topicRequestFindManyMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  updateManyMock: vi.fn(),
  getSettingMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  enrollmentFindManyMock: vi.fn(),
  topicRequestFindManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: {
      findMany: findManyMock,
      count: countMock,
      updateMany: updateManyMock,
    },
    user: { findUnique: userFindUniqueMock },
    classEnrollment: { findMany: enrollmentFindManyMock },
    topicRequest: { findMany: topicRequestFindManyMock },
  },
}));

vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import { GET } from "@/app/api/classes/route";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/classes${query}`);
}

const learner = { user: { id: "u1", role: "STUDENT_LEARNER" } };

describe("GET /api/classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 0 });
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);
    getSettingMock.mockResolvedValue(false);
    userFindUniqueMock.mockResolvedValue({ gradeLevel: "GRADE_9" });
    enrollmentFindManyMock.mockResolvedValue([]);
    topicRequestFindManyMock.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  function browseRow(id: string, over: Record<string, unknown> = {}) {
    return {
      id,
      subject: "MATH",
      gradeLevel: null,
      status: "SCHEDULED",
      published: true,
      maxStudents: 2,
      createdAt: new Date("2026-08-01"),
      topics: [{ topic: "Fractions & Decimals" }],
      sessions: [
        { id: `s-${id}`, status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3600_000), duration: 60 },
      ],
      tutorProfile: {
        id: "tp1",
        user: { id: "t1", anonymousId: "TUT-0001", firstName: "A", lastName: "B", section: "R" },
        topicCertifications: [{ subject: "MATH", topic: "Fractions & Decimals" }],
      },
      _count: { enrollments: 0 },
      enrollments: [],
      ...over,
    };
  }

  it("browse (unfiltered) ranks in JS and slices the page — no SQL skip/take", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    countMock.mockResolvedValueOnce(30).mockResolvedValueOnce(4); // browse, mineUpcoming
    findManyMock.mockResolvedValue([browseRow("c1")]);

    const res = await GET(makeRequest("?page=1&pageSize=12"));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.total).toBe(30);
    expect(json.counts).toMatchObject({
      browse: 30,
      mine: 4,
      mineTabs: { upcoming: 4, completed: 0, cancelled: 0 },
    });
    expect(json.classes[0]).toMatchObject({ id: "c1", tutor: { id: "t1", anonymousId: "TUT-0001" } });

    const call = findManyMock.mock.calls[0][0];
    expect(call.where).toEqual({
      status: "SCHEDULED",
      published: true,
      sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: expect.any(Date) } } },
      enrollments: { none: { learnerId: "u1" } },
    });
    expect(call.skip).toBeUndefined();
    expect(call.take).toBeUndefined();
    expect(updateManyMock).toHaveBeenCalled(); // reinstateExpiredClasses
  });

  it("browse personalization ranks an interest-subject / sooner class ahead of a newer one", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    enrollmentFindManyMock.mockResolvedValue([
      { class: { subject: "SCIENCE", topics: [{ topic: "Ecosystems" }] } },
    ]);
    findManyMock.mockResolvedValue([
      // newest, but no interest overlap and a far-off session
      browseRow("newer", {
        subject: "MATH",
        createdAt: new Date("2026-08-20"),
        sessions: [{ id: "s-n", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 30 * 864e5), duration: 60 }],
      }),
      // older, but matches the learner's SCIENCE interest and a soon session
      browseRow("match", {
        subject: "SCIENCE",
        createdAt: new Date("2026-08-01"),
        topics: [{ topic: "Ecosystems" }],
        sessions: [{ id: "s-m", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 864e5), duration: 60 }],
        tutorProfile: {
          id: "tp2",
          user: { id: "t2", anonymousId: "TUT-0002", firstName: "C", lastName: "D", section: "R" },
          topicCertifications: [],
        },
      }),
    ]);

    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.classes.map((c: { id: string }) => c.id)).toEqual(["match", "newer"]);
  });

  it("ANDs browse filters (q / subject / gradeLevel) onto the base browse where", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    // order: browse, mineUpcoming, mineCompleted, mineCancelled, filteredCount
    countMock
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);

    const res = await GET(makeRequest("?q=algebra&subject=MATH&gradeLevel=GRADE_9"));
    const json = await res.json();

    expect(json.total).toBe(2);
    expect(json.counts).toMatchObject({ browse: 30, mine: 4 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({ status: "SCHEDULED", published: true }),
            {
              subject: "MATH",
              gradeLevel: "GRADE_9",
              OR: [
                { code: { contains: "algebra" } },
                { topics: { some: { topic: { contains: "algebra" } } } },
                { tutorProfile: { user: { anonymousId: { contains: "algebra" } } } },
              ],
            },
          ],
        },
      })
    );
  });

  it("scope=mine defaults to the Upcoming tab (SCHEDULED + SUSPENDED)", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(makeRequest("?scope=mine"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { enrollments: { some: { learnerId: "u1" } } },
            { status: { in: ["SCHEDULED", "SUSPENDED"] } },
          ],
        },
        skip: 0,
      })
    );
  });

  it("scope=mine&status=completed filters to COMPLETED and can add search filters", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(makeRequest("?scope=mine&status=completed&subject=SCIENCE"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { enrollments: { some: { learnerId: "u1" } } },
            { status: "COMPLETED" },
            { subject: "SCIENCE" },
          ],
        },
      })
    );
  });

  it("returns 500 on unexpected error", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    findManyMock.mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/unexpected error/i);
  });
});
