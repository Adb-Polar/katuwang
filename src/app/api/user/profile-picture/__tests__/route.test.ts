import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getServerSessionMock,
  userFindUniqueMock,
  userUpdateMock,
  deleteFilesMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
  deleteFilesMock: vi.fn(),
}));

vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
}));

vi.mock("uploadthing/server", () => {
  class UTApi {
    deleteFiles = deleteFilesMock;
  }
  return {
    UTApi,
    UploadThingError: class extends Error {},
  };
});

import { GET, DELETE } from "@/app/api/user/profile-picture/route";

describe("GET /api/user/profile-picture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    userFindUniqueMock.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 200 with user profile picture details", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    userFindUniqueMock.mockResolvedValue({
      image: "https://utfs.io/f/pic.jpg",
      profilePictureLocked: false,
      profilePictureUpdatedAt: new Date("2026-10-16T10:00:00Z"),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.image).toBe("https://utfs.io/f/pic.jpg");
    expect(json.profilePictureLocked).toBe(false);
  });
});

describe("DELETE /api/user/profile-picture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("returns 403 when user profile picture editing is locked", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    userFindUniqueMock.mockResolvedValue({
      imageKey: "key_123",
      profilePictureLocked: true,
    });

    const res = await DELETE();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("locked");
  });

  it("deletes cloud asset and clears user picture fields on success", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    userFindUniqueMock.mockResolvedValue({
      imageKey: "key_123",
      profilePictureLocked: false,
    });
    deleteFilesMock.mockResolvedValue({ success: true });
    userUpdateMock.mockResolvedValue({ id: "u1" });

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(deleteFilesMock).toHaveBeenCalledWith("key_123");
    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          image: null,
          imageKey: null,
        }),
      })
    );
  });
});
