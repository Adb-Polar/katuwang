import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, userUpdate } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: userUpdate },
  },
}));

import { PATCH } from "@/app/api/tutor/profile/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/tutor/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await PATCH(makeRequest({ section: "A" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an empty section", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(makeRequest({ section: "" }));
    expect(res.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when contactInfo exceeds the max length", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    const res = await PATCH(makeRequest({ contactInfo: "a".repeat(201) }));
    expect(res.status).toBe(400);
  });

  it("updates contactInfo only", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    userUpdate.mockResolvedValue({ contactInfo: "09171234567", section: "Rizal" });

    const res = await PATCH(makeRequest({ contactInfo: "09171234567" }));
    expect(res.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { contactInfo: "09171234567" },
      })
    );
  });

  it("updates section only", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    userUpdate.mockResolvedValue({ contactInfo: null, section: "Bonifacio" });

    const res = await PATCH(makeRequest({ section: "Bonifacio" }));
    expect(res.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { section: "Bonifacio" },
      })
    );
  });

  it("updates both fields at once", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    userUpdate.mockResolvedValue({ contactInfo: "09171234567", section: "Bonifacio" });

    const res = await PATCH(makeRequest({ contactInfo: "09171234567", section: "Bonifacio" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ contactInfo: "09171234567", section: "Bonifacio" });
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    userUpdate.mockRejectedValue(new Error("db down"));
    const res = await PATCH(makeRequest({ section: "A" }));
    expect(res.status).toBe(500);
  });
});
