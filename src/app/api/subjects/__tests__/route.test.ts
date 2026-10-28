import { describe, it, expect, vi } from "vitest";
const { getServerSessionMock, getSubjectsMock } = vi.hoisted(() => ({ getServerSessionMock: vi.fn(), getSubjectsMock: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/subjects", () => ({ getSubjects: getSubjectsMock }));
import { GET } from "../route";

describe("public curriculum catalog", () => {
  it("retains string topics and adds grade evidence for clients", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "learner" } });
    const curriculum = { status: "mapped", sources: [{ url: "https://www.deped.gov.ph/" }] };
    getSubjectsMock.mockResolvedValue([{ slug: "MATH", name: "Mathematics", gradeLevels: ["GRADE_9", "GRADE_10"], curriculum,
      topics: [{ name: "Trigonometry", gradeLevels: ["GRADE_9", "GRADE_10"], curriculum }] }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).subjects[0]).toEqual({ slug: "MATH", name: "Mathematics", gradeLevels: ["GRADE_9", "GRADE_10"], curriculum,
      topics: ["Trigonometry"], topicGrades: { Trigonometry: ["GRADE_9", "GRADE_10"] }, topicDetails: [{ name: "Trigonometry", gradeLevels: ["GRADE_9", "GRADE_10"], curriculum }] });
  });
  it("requires authentication", async () => {
    getServerSessionMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
});
