import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getServerSessionMock, platformSettingFindUnique, platformSettingUpsert } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  platformSettingFindUnique: vi.fn(),
  platformSettingUpsert: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformSetting: { findUnique: platformSettingFindUnique, upsert: platformSettingUpsert },
  },
}));

import { GET, PATCH } from "@/app/api/admin/settings/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/admin/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns defaults when no rows exist yet", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    platformSettingFindUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(
      expect.arrayContaining([
        { key: "requireCertificationForClassCreation", value: false },
        { key: "registrationOpen", value: true },
      ])
    );
  });
});

describe("PATCH /api/admin/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ key: "registrationOpen", value: false }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid key", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    const res = await PATCH(makeRequest({ key: "notAKey", value: true }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-boolean value", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    const res = await PATCH(makeRequest({ key: "registrationOpen", value: "yes" }));
    expect(res.status).toBe(400);
  });

  it("accepts the matchingEnabled key", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    platformSettingUpsert.mockResolvedValue({ key: "matchingEnabled", value: "false" });

    const res = await PATCH(makeRequest({ key: "matchingEnabled", value: false }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ key: "matchingEnabled", value: false });
  });

  it("upserts the setting and returns the boolean value", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    platformSettingUpsert.mockResolvedValue({ key: "registrationOpen", value: "false" });

    const res = await PATCH(makeRequest({ key: "registrationOpen", value: false }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ key: "registrationOpen", value: false });
    expect(platformSettingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "registrationOpen" },
        update: { value: "false" },
        create: { key: "registrationOpen", value: "false" },
      })
    );
  });

  it("updates profilePictureRequirement setting with valid enum option", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    platformSettingUpsert.mockResolvedValue({
      key: "profilePictureRequirement",
      value: "TUTORS_ONLY",
    });

    const res = await PATCH(
      makeRequest({ key: "profilePictureRequirement", value: "TUTORS_ONLY" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ key: "profilePictureRequirement", value: "TUTORS_ONLY" });
  });

  it("rejects invalid profilePictureRequirement setting value", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });

    const res = await PATCH(
      makeRequest({ key: "profilePictureRequirement", value: "INVALID_VALUE" })
    );
    expect(res.status).toBe(400);
  });
});
