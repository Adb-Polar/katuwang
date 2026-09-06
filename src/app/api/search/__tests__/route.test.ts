import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classFindMany, userFindMany, getSubjectsMock, getSettingMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindMany: vi.fn(),
  userFindMany: vi.fn(),
  getSubjectsMock: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { tutorClass: { findMany: classFindMany }, user: { findMany: userFindMany } },
}));
vi.mock("@/lib/subjects", () => ({ getSubjects: getSubjectsMock }));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
// browseClassesWhere is a pure helper — keep the real one.

import { GET } from "@/app/api/search/route";

const req = (q: string) => new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(q)}`);

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
    getSubjectsMock.mockResolvedValue([
      { slug: "MATH", name: "Mathematics", topics: [{ name: "Linear equations" }, { name: "Fractions" }] },
    ]);
    classFindMany.mockResolvedValue([
      { id: "c1", code: "C-0231", subject: "MATH", topics: [{ topic: "Linear equations" }], status: "SCHEDULED" },
    ]);
    userFindMany.mockResolvedValue([{ id: "u1", anonymousId: "TUT-0148" }]);
  });

  it("401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await GET(req("linear"))).status).toBe(401);
  });

  it("returns no groups for a query shorter than 2 chars", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    const json = await (await GET(req("a"))).json();
    expect(json.groups).toEqual([]);
    expect(classFindMany).not.toHaveBeenCalled();
  });

  it("learner: returns class, tutor and topic groups with learner hrefs", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    const json = await (await GET(req("linear"))).json();
    const kinds = json.groups.map((g: { kind: string }) => g.kind);
    expect(kinds).toEqual(expect.arrayContaining(["class", "tutor", "topic"]));
    const cls = json.groups.find((g: { kind: string }) => g.kind === "class");
    expect(cls.items[0].href).toBe("/learner/classes/c1");
    const tut = json.groups.find((g: { kind: string }) => g.kind === "tutor");
    expect(tut.items[0].href).toBe("/learner/tutors/u1");
    const top = json.groups.find((g: { kind: string }) => g.kind === "topic");
    expect(top.items[0].href).toContain("/learner/classes?q=");
  });

  it("tutor: only searches their own classes, no tutor group", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
    const json = await (await GET(req("linear"))).json();
    expect(json.groups.some((g: { kind: string }) => g.kind === "tutor")).toBe(false);
    const where = classFindMany.mock.calls[0][0].where;
    expect(where.tutorProfile).toEqual({ userId: "T1" });
  });
});
