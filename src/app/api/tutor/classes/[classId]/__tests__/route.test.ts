import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, classFindUnique, tutorProfileFindUnique, classUpdate, classFindMany } = vi.hoisted(
  () => ({
    getServerSessionMock: vi.fn(),
    classFindUnique: vi.fn(),
    tutorProfileFindUnique: vi.fn(),
    classUpdate: vi.fn(),
    classFindMany: vi.fn(),
  })
);

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorClass: { findUnique: classFindUnique, update: classUpdate, findMany: classFindMany },
    tutorProfile: { findUnique: tutorProfileFindUnique },
  },
}));

import { PATCH } from "@/app/api/tutor/classes/[classId]/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patch(body: unknown, classId = "c1") {
  return PATCH(makeRequest(body), { params: Promise.resolve({ classId }) });
}

describe("PATCH /api/tutor/classes/[classId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the class was suspended by an admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      tutorProfileId: "tp1",
      status: "SUSPENDED",
      _count: { enrollments: 0 },
    });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });

    const res = await patch({ status: "SCHEDULED" });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/suspended/i);
    expect(classUpdate).not.toHaveBeenCalled();
  });
});
