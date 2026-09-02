import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  topicRequestFindUnique,
  topicRequestUpdate,
  tutorClassFindUnique,
  getSettingMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  topicRequestFindUnique: vi.fn(),
  topicRequestUpdate: vi.fn(),
  tutorClassFindUnique: vi.fn(),
  getSettingMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    topicRequest: { findUnique: topicRequestFindUnique, update: topicRequestUpdate },
    tutorClass: { findUnique: tutorClassFindUnique },
  },
}));
vi.mock("@/lib/settings", () => ({ getSetting: getSettingMock }));

import { POST } from "@/app/api/tutor/topic-requests/[id]/fulfill/route";

const params = Promise.resolve({ id: "r1" });
const tutor = { user: { id: "T1", role: "STUDENT_TUTOR" } };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/topic-requests/r1/fulfill", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/tutor/topic-requests/[id]/fulfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockResolvedValue(true);
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    topicRequestFindUnique.mockResolvedValue({ id: "r1", status: "OPEN", subject: "MATH" });
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "MATH" });
    topicRequestUpdate.mockResolvedValue({ id: "r1", status: "FULFILLED", fulfilledClassId: "c1" });
  });

  it("403 when the class belongs to another tutor", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "other", status: "SCHEDULED", subject: "MATH" });
    const res = await POST(makeRequest({ classId: "c1" }), { params });
    expect(res.status).toBe(403);
    expect(topicRequestUpdate).not.toHaveBeenCalled();
  });

  it("400 when the class subject does not match the request", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    tutorClassFindUnique.mockResolvedValue({ id: "c1", tutorProfileId: "tp1", status: "SCHEDULED", subject: "SCIENCE" });
    const res = await POST(makeRequest({ classId: "c1" }), { params });
    expect(res.status).toBe(400);
  });

  it("400 when the request is not open", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    topicRequestFindUnique.mockResolvedValue({ id: "r1", status: "FULFILLED", subject: "MATH" });
    const res = await POST(makeRequest({ classId: "c1" }), { params });
    expect(res.status).toBe(400);
  });

  it("marks the request FULFILLED and links the class, without enrolling anyone", async () => {
    getServerSessionMock.mockResolvedValue(tutor);
    const res = await POST(makeRequest({ classId: "c1" }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: "r1", status: "FULFILLED", fulfilledClassId: "c1" });
    expect(topicRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: { status: "FULFILLED", fulfilledClassId: "c1" },
      })
    );
  });
});
