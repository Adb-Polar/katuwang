vi.mock("@/lib/teachingBankAccess", () => ({
  certifiedBankTopics: vi.fn().mockResolvedValue([{ subject: "MATH", topic: "Fractions" }]),
  certifiedBankWhere: (topics: { subject: string; topic: string }[]) => ({ OR: topics }),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { assessmentQuestion: { findMany: findManyMock, count: countMock } },
}));

import { GET } from "@/app/api/tutor/question-bank/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(tutor);
  findManyMock.mockResolvedValue([]);
  countMock.mockResolvedValue(0);
});

describe("GET /api/tutor/question-bank", () => {
  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U1", role: "STUDENT_LEARNER" } });
    const res = await GET(new NextRequest("http://localhost/api/tutor/question-bank"));
    expect(res.status).toBe(401);
  });

  it("always scopes to active BANK questions (never TUTOR-authored)", async () => {
    await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=MATH"));
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ origin: "BANK", active: true, subject: "MATH" }),
      }),
    );
  });
});

import { certifiedBankTopics } from "@/lib/teachingBankAccess";
describe("certified teaching bank policy", () => {
  it("does not query any bank material for an uncertified tutor", async () => {
    vi.mocked(certifiedBankTopics).mockResolvedValueOnce([]);
    const res = await GET(new NextRequest("http://localhost/api/tutor/question-bank"));
    expect(await res.json()).toMatchObject({ questions: [], total: 0 });
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
  });
  it("keeps subject/topic authorization ANDed with user-supplied filters", async () => {
    await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=SCIENCE&topic=Cells"));
    const where = findManyMock.mock.calls[0][0].where;
    expect(where).toMatchObject({ subject: "SCIENCE", topic: "Cells", AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }] });
    expect(countMock).toHaveBeenCalledWith({ where });
  });
});
