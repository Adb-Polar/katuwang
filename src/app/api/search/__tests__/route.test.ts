import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  classFindMany,
  userFindMany,
  tutorProfileFindUnique,
  topicRequestFindMany,
  getSubjectsMock,
  resolveSubjectSlugsMock,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  classFindMany: vi.fn(),
  userFindMany: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  topicRequestFindMany: vi.fn(),
  getSubjectsMock: vi.fn(),
  resolveSubjectSlugsMock: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findMany: classFindMany },
    user: { findMany: userFindMany },
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicRequest: { findMany: topicRequestFindMany },
  },
}));
vi.mock("@/lib/subjects", () => ({
  getSubjects: getSubjectsMock,
  resolveSubjectSlugs: resolveSubjectSlugsMock,
}));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));
// browseClassesWhere is a pure helper — keep the real one.

import { GET } from "@/app/api/search/route";

const req = (q: string, scope?: string) =>
  new NextRequest(
    `http://localhost/api/search?q=${encodeURIComponent(q)}${scope ? `&scope=${scope}` : ""}`,
  );

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(false);
    resolveSubjectSlugsMock.mockResolvedValue([]);
    getSubjectsMock.mockResolvedValue([
      { slug: "MATH", name: "Mathematics", topics: [{ name: "Linear equations" }, { name: "Fractions" }] },
    ]);
    classFindMany.mockResolvedValue([
      { id: "c1", code: "C-0231", subject: "MATH", topics: [{ topic: "Linear equations" }], status: "SCHEDULED" },
    ]);
    userFindMany.mockResolvedValue([{ id: "u1", anonymousId: "TUT-0148" }]);
    tutorProfileFindUnique.mockResolvedValue({ id: "TP1", topicCertifications: [] });
    topicRequestFindMany.mockResolvedValue([]);
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

  it("tutor: surfaces eligible open topic requests as a 'Class requests' group", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "T1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "TP1", topicCertifications: [] });
    topicRequestFindMany.mockResolvedValue([
      { id: "r1", subject: "MATH", topics: [{ topic: "Linear equations" }], directedTutorProfileId: "TP1" },
    ]);
    const json = await (await GET(req("linear"))).json();
    const g = json.groups.find((x: { label: string }) => x.label === "Class requests");
    expect(g).toBeTruthy();
    expect(g.items[0].href).toBe("/tutor/requests/r1/accept");
    expect(g.items[0].subtitle).toBe("Directed to you");
  });

  it("learner scope=classCode: only searches the class code, no tutor/topic groups", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    const json = await (await GET(req("C-0231", "classCode"))).json();
    const kinds = json.groups.map((g: { kind: string }) => g.kind);
    expect(kinds).not.toContain("tutor");
    expect(kinds).not.toContain("topic");
    expect(classFindMany.mock.calls[0][0].where.OR).toEqual([{ code: { contains: "C-0231" } }]);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("learner scope=tutorCode: only searches tutors by anonymous ID", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    const json = await (await GET(req("TUT-0148", "tutorCode"))).json();
    const kinds = json.groups.map((g: { kind: string }) => g.kind);
    expect(kinds).toEqual(["tutor"]);
    expect(classFindMany).not.toHaveBeenCalled();
    expect(userFindMany.mock.calls[0][0].where.OR).toEqual([{ anonymousId: { contains: "TUT-0148" } }]);
  });

  it("learner scope=subject: resolves a subject name to slugs for the class query", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
    resolveSubjectSlugsMock.mockResolvedValue(["MATH"]);
    await GET(req("Mathematics", "subject"));
    expect(classFindMany.mock.calls[0][0].where.OR).toEqual(
      expect.arrayContaining([{ subject: { in: ["MATH"] } }]),
    );
    expect(userFindMany).not.toHaveBeenCalled();
  });
});
