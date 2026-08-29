import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerSessionMock,
  tutorProfileFindUnique,
  availabilityFindMany,
  availabilityDeleteMany,
  availabilityCreateMany,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  tutorProfileFindUnique: vi.fn(),
  availabilityFindMany: vi.fn(),
  availabilityDeleteMany: vi.fn(),
  availabilityCreateMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorProfile: { findUnique: tutorProfileFindUnique },
    availability: {
      findMany: availabilityFindMany,
      deleteMany: availabilityDeleteMany,
      createMany: availabilityCreateMany,
    },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        availability: {
          deleteMany: availabilityDeleteMany,
          createMany: availabilityCreateMany,
          findMany: availabilityFindMany,
        },
      }),
  },
}));

import { GET, PUT } from "@/app/api/tutor/availability/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tutor/availability", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/tutor/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 200 with an empty list", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    availabilityFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 200 with the tutor's slots", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    availabilityFindMany.mockResolvedValue([
      { id: "a1", day: "MONDAY", startTime: "09:00", endTime: "10:00" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/tutor/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for the wrong role", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_LEARNER" } });
    const res = await PUT(makeRequest({ slots: [] }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no tutor profile exists", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue(null);
    const res = await PUT(makeRequest({ slots: [] }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid day", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await PUT(
      makeRequest({ slots: [{ day: "FUNDAY", startTime: "09:00", endTime: "10:00" }] })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a malformed time", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await PUT(
      makeRequest({ slots: [{ day: "MONDAY", startTime: "9am", endTime: "10:00" }] })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when startTime is not before endTime", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await PUT(
      makeRequest({ slots: [{ day: "MONDAY", startTime: "10:00", endTime: "09:00" }] })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for overlapping same-day slots", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    const res = await PUT(
      makeRequest({
        slots: [
          { day: "MONDAY", startTime: "09:00", endTime: "10:30" },
          { day: "MONDAY", startTime: "10:00", endTime: "11:00" },
        ],
      })
    );
    expect(res.status).toBe(400);
    expect(availabilityDeleteMany).not.toHaveBeenCalled();
  });

  it("replaces the full slot set successfully", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    availabilityFindMany.mockResolvedValue([
      { id: "a1", day: "MONDAY", startTime: "09:00", endTime: "10:00" },
    ]);

    const res = await PUT(
      makeRequest({ slots: [{ day: "MONDAY", startTime: "09:00", endTime: "10:00" }] })
    );

    expect(res.status).toBe(200);
    expect(availabilityDeleteMany).toHaveBeenCalledWith({ where: { tutorProfileId: "tp1" } });
    expect(availabilityCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ tutorProfileId: "tp1", day: "MONDAY", startTime: "09:00", endTime: "10:00" }],
      })
    );
  });

  it("skips createMany when clearing all slots", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockResolvedValue({ id: "tp1" });
    availabilityFindMany.mockResolvedValue([]);

    const res = await PUT(makeRequest({ slots: [] }));

    expect(res.status).toBe(200);
    expect(availabilityDeleteMany).toHaveBeenCalled();
    expect(availabilityCreateMany).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT_TUTOR" } });
    tutorProfileFindUnique.mockRejectedValue(new Error("db down"));
    const res = await PUT(makeRequest({ slots: [] }));
    expect(res.status).toBe(500);
  });
});
