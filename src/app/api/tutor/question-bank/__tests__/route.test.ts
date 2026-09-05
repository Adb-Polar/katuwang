import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
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
