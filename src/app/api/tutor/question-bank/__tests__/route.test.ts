vi.mock("@/lib/settings", () => ({ getSetting: vi.fn().mockResolvedValue(true) }));
import { getSetting } from "@/lib/settings";
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
  vi.mocked(getSetting).mockResolvedValue(true);
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
  it("returns questions immediately when no search term is supplied", async () => {
    const question = { id: "Q1", subject: "MATH", topic: "Fractions", prompt: "Solve 2x = 6.", options: [] };
    findManyMock.mockResolvedValue([question]);
    countMock.mockResolvedValue(1);

    const res = await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=MATH"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ questions: [question], total: 1, page: 1, pageSize: 10, requiresCertification: true });
    expect(findManyMock.mock.calls[0][0].where).toEqual({ AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }], origin: "BANK", active: true, subject: "MATH" });
  });

  it("searches question text and topic names while preserving subject and active-bank filters", async () => {
    await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=MATH&q=%20Algebra%20"));

    const where = {
      AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }],
      origin: "BANK",
      active: true,
      subject: "MATH",
      OR: [{ prompt: { contains: "Algebra" } }, { topic: { contains: "Algebra" } }],
    };
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(countMock).toHaveBeenCalledWith({ where });
  });

  it("applies topic filters and paginates search results consistently", async () => {
    const res = await GET(new NextRequest(
      "http://localhost/api/tutor/question-bank?subject=MATH&topic=Linear%20Equations&q=solve&page=2&pageSize=50",
    ));

    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }], origin: "BANK", active: true, subject: "MATH", topic: "Linear Equations",
        OR: [{ prompt: { contains: "solve" } }, { topic: { contains: "solve" } }],
      },
      skip: 50,
      take: 50,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
    expect(await res.json()).toEqual({ questions: [], total: 0, page: 2, pageSize: 50, requiresCertification: true });
  });

  it("treats a whitespace-only search as browsing the bank", async () => {
    await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=MATH&q=%20%20"));

    expect(findManyMock.mock.calls[0][0].where).toEqual({ AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }], origin: "BANK", active: true, subject: "MATH" });
  });
});

import { certifiedBankTopics } from "@/lib/teachingBankAccess";
describe("certified teaching bank policy", () => {
  it("allows active bank questions without certification when the administrator disables the requirement", async () => {
    vi.mocked(getSetting).mockResolvedValue(false);
    findManyMock.mockResolvedValue([{ id: "Q1", subject: "JHS_ARALING_PANLIPUNAN" }]);
    countMock.mockResolvedValue(1);
    const res = await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=JHS_ARALING_PANLIPUNAN&topic=Kolonyalismo"));
    expect(await res.json()).toMatchObject({ total: 1, requiresCertification: false });
    expect(certifiedBankTopics).not.toHaveBeenCalled();
    expect(findManyMock.mock.calls[0][0].where).toEqual({
      origin: "BANK", active: true, subject: "JHS_ARALING_PANLIPUNAN", topic: "Kolonyalismo",
    });
    expect(getSetting).toHaveBeenCalledWith("requireCertificationForClassCreation");
  });
  it("does not query any bank material for an uncertified tutor", async () => {
    vi.mocked(certifiedBankTopics).mockResolvedValueOnce([]);
    const res = await GET(new NextRequest("http://localhost/api/tutor/question-bank"));
    expect(await res.json()).toMatchObject({ questions: [], total: 0 });
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
  });
  it("keeps subject/topic authorization ANDed with user-supplied filters", async () => {
    await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=SCIENCE&topic=Cells&q=cell"));
    const where = findManyMock.mock.calls[0][0].where;
    expect(where).toMatchObject({ subject: "SCIENCE", topic: "Cells", AND: [{ OR: [{ subject: "MATH", topic: "Fractions" }] }] });
    expect(countMock).toHaveBeenCalledWith({ where });
  });
});
