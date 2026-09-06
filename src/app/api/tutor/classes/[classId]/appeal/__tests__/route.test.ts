import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  classFindUnique,
  appealFindFirst,
  appealCreate,
  userFindMany,
  notifyManyMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  classFindUnique: vi.fn(),
  appealFindFirst: vi.fn(),
  appealCreate: vi.fn(),
  userFindMany: vi.fn(),
  notifyManyMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/notifications", () => ({ notifyMany: notifyManyMock }));
vi.mock("@/lib/prisma", () => {
  const tx = {
    classAppeal: { create: appealCreate },
    user: { findMany: userFindMany },
  };
  return {
    prisma: {
      tutorProfile: { findUnique: tutorProfileFindUnique },
      tutorClass: { findUnique: classFindUnique },
      classAppeal: { findFirst: appealFindFirst, create: appealCreate },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    },
  };
});

import { POST } from "@/app/api/tutor/classes/[classId]/appeal/route";

const tutor = { user: { id: "U1", role: "STUDENT_TUTOR" } };
const params = { params: Promise.resolve({ classId: "c1" }) };

function req(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/classes/c1/appeal", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const goodBody = { reason: "This class was flagged by mistake, the room was booked correctly." };

describe("POST /api/tutor/classes/[classId]/appeal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1", user: { anonymousId: "TUT-0007" } });
    classFindUnique.mockResolvedValue({
      id: "c1",
      status: "SUSPENDED",
      tutorProfileId: "tp1",
      code: "C-0231",
      subject: "MATH",
    });
    appealFindFirst.mockResolvedValue(null);
    appealCreate.mockResolvedValue({ id: "a1", status: "PENDING" });
    userFindMany.mockResolvedValue([{ id: "admin1" }, { id: "admin2" }]);
  });

  it("401 for a non-tutor", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "U9", role: "STUDENT_LEARNER" } });
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(401);
  });

  it("400 on a too-short reason", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(req({ reason: "nope" }), params);
    expect(res.status).toBe(400);
  });

  it("404 when the class does not exist", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classFindUnique.mockResolvedValue(null);
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(404);
  });

  it("403 when the class belongs to another tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classFindUnique.mockResolvedValue({ id: "c1", status: "BANNED", tutorProfileId: "tp-other" });
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(403);
  });

  it("400 when the class is not suspended or banned", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    classFindUnique.mockResolvedValue({ id: "c1", status: "SCHEDULED", tutorProfileId: "tp1" });
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(400);
  });

  it("409 when a pending appeal already exists", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    appealFindFirst.mockResolvedValue({ id: "a0" });
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(409);
    expect(appealCreate).not.toHaveBeenCalled();
  });

  it("201 and creates the appeal on the happy path", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(req(goodBody), params);
    expect(res.status).toBe(201);
    expect(appealCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ classId: "c1", tutorProfileId: "tp1", reason: goodBody.reason }),
      })
    );
  });

  it("notifies every active admin with a CLASS_APPEAL_NEW notification", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    await POST(req(goodBody), params);
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "ADMIN", status: "ACTIVE" } })
    );
    expect(notifyManyMock).toHaveBeenCalledWith(
      expect.anything(),
      ["admin1", "admin2"],
      "CLASS_APPEAL_NEW",
      expect.stringContaining("TUT-0007"),
      "/admin/class-appeals"
    );
  });
});
