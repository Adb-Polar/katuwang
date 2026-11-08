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
  resolveSubjectSlugsMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  updateManyMock: vi.fn(),
  getSettingMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  enrollmentFindManyMock: vi.fn(),
  topicRequestFindManyMock: vi.fn(),
  resolveSubjectSlugsMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
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
vi.mock("@/lib/subjects", () => ({ resolveSubjectSlugs: resolveSubjectSlugsMock }));

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
    resolveSubjectSlugsMock.mockResolvedValue([]);
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
      sessions: { some: { status: "SCHEDULED", scheduledAt: { gt: expect.any(Date) } }, none: { scheduledAt: { lte: expect.any(Date) } } },
      enrollments: { none: { learnerId: "u1", withdrawnAt: null } },
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

  it("shows every grade to a Grade 9 learner without a grade visibility restriction", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    const grades = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12", null];
    findManyMock.mockResolvedValue(grades.map((gradeLevel, i) => browseRow(`c${i}`, { gradeLevel })));
    countMock.mockResolvedValue(7);

    const res = await GET(makeRequest());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.classes).toHaveLength(7);
    expect(json.classes.map((c: { gradeLevel: string | null }) => c.gradeLevel)).toEqual(expect.arrayContaining(grades));
    expect(findManyMock.mock.calls[0][0].where).not.toHaveProperty("gradeLevel");
    expect(findManyMock.mock.calls[0][0].where).not.toHaveProperty("tutorProfile");
    expect(findManyMock.mock.calls[0][0].where).not.toHaveProperty("OR");
  });

  it.each(["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"])(
    "lets a learner explicitly filter classes at %s",
    async (gradeLevel) => {
      getServerSessionMock.mockResolvedValue(learner);
      const res = await GET(makeRequest(`?gradeLevel=${gradeLevel}`));
      expect(res.status).toBe(200);
      expect(findManyMock.mock.calls[0][0].where.AND[1]).toEqual({ gradeLevel });
    }
  );

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
                { subject: { contains: "algebra" } },
                { topics: { some: { topic: { contains: "algebra" } } } },
                { tutorProfile: { user: { anonymousId: { contains: "algebra" } } } },
              ],
            },
          ],
        },
      })
    );
  });

  it("search by subject display name resolves to slugs in the OR filter", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    resolveSubjectSlugsMock.mockResolvedValue(["MATH"]);
    countMock
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await GET(makeRequest("?q=Mathematics"));

    const call = findManyMock.mock.calls[0][0];
    const filters = call.where.AND[1];
    expect(filters.OR).toEqual(
      expect.arrayContaining([{ subject: { in: ["MATH"] } }]),
    );
  });

  it("scope=mine defaults to the Upcoming tab (SCHEDULED + SUSPENDED)", async () => {
    getServerSessionMock.mockResolvedValue(learner);
    await GET(makeRequest("?scope=mine"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { enrollments: { some: { learnerId: "u1", withdrawnAt: null } } },
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
            { enrollments: { some: { learnerId: "u1", withdrawnAt: null } } },
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
