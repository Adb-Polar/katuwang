import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), update: vi.fn(), remove: vi.fn(), session: vi.fn(), upload: vi.fn(), optimize: vi.fn(),
  middleware: null as unknown as () => Promise<unknown>,
  complete: null as unknown as (arg: { metadata: { userId: string; role: string; oldKey?: string }; file: { key: string; name: string; ufsUrl: string } }) => Promise<unknown>,
}));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.account, update: mocks.update } } }));
vi.mock("uploadthing/next", () => ({ createUploadthing: () => () => ({ middleware: (fn: typeof mocks.middleware) => {
  mocks.middleware = fn;
  return { onUploadComplete: (fn: typeof mocks.complete) => { mocks.complete = fn; return {}; } };
} }) }));
vi.mock("uploadthing/server", () => ({ UploadThingError: class extends Error {}, UTApi: class { deleteFiles = mocks.remove; uploadFiles = mocks.upload; } }));
vi.mock("@/lib/images/serverImageOptimizer", () => ({ optimizeImageBuffer: mocks.optimize }));
import "@/app/api/uploadthing/core";
const event = { metadata: { userId: "qa", role: "STUDENT_TUTOR", oldKey: "old-file" }, file: { key: "new-file", name: "avatar-qa.webp", ufsUrl: "https://example.test/avatar.webp" } };
const active = { role: "STUDENT_TUTOR", status: "ACTIVE", profilePictureLocked: false };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.remove.mockResolvedValue(undefined);
  mocks.update.mockResolvedValue({});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  mocks.optimize.mockResolvedValue({ buffer: Buffer.from("clean"), format: "webp", mimeType: "image/webp" });
  mocks.upload.mockResolvedValue({ data: { key: "clean-file", ufsUrl: "https://example.test/clean.webp" } });
});
describe("upload account revocation", () => {
  it("rejects an inactive session in upload middleware", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(mocks.middleware()).rejects.toThrow("Unauthorized");
    expect(mocks.account).not.toHaveBeenCalled();
  });
  for (const account of [null, { role: "STUDENT_TUTOR", status: "SUSPENDED" }, { role: "ADMIN", status: "ACTIVE" }, { role: "STUDENT_TUTOR", status: "ACTIVE", profilePictureLocked: true }]) {
    it(`rejects and cleans up a delayed callback after revocation: ${JSON.stringify(account)}`, async () => {
      mocks.account.mockResolvedValue(account);
      await expect(mocks.complete(event)).rejects.toThrow("no longer authorized");
      expect(mocks.remove).toHaveBeenCalledWith("new-file");
      expect(mocks.update).not.toHaveBeenCalled();
    });
  }
  it("allows an active unlocked account callback and stores the sanitised copy", async () => {
    mocks.account.mockResolvedValue(active);
    await mocks.complete(event);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "qa" }, data: expect.objectContaining({ imageKey: "clean-file", image: "https://example.test/clean.webp" }) }));
    expect(mocks.remove).toHaveBeenCalledWith("new-file");
    expect(mocks.remove).toHaveBeenCalledWith("old-file");
  });
});

describe("upload sanitisation", () => {
  it("re-encodes even when the client-chosen name looks pre-optimised", async () => {
    mocks.account.mockResolvedValue(active);
    await mocks.complete(event); // name is "avatar-qa.webp"
    expect(mocks.optimize).toHaveBeenCalledTimes(1);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });

  it("rejects and deletes an upload the optimiser refuses, keeping the old avatar", async () => {
    mocks.account.mockResolvedValue(active);
    mocks.optimize.mockRejectedValue(new Error("Unsupported image format"));
    await expect(mocks.complete(event)).rejects.toThrow("could not be processed");
    expect(mocks.remove).toHaveBeenCalledWith("new-file");
    expect(mocks.remove).not.toHaveBeenCalledWith("old-file");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects when the uploaded file cannot be fetched back", async () => {
    mocks.account.mockResolvedValue(active);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(mocks.complete(event)).rejects.toThrow("could not be processed");
    expect(mocks.optimize).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects when storing the sanitised copy fails", async () => {
    mocks.account.mockResolvedValue(active);
    mocks.upload.mockResolvedValue({ data: null, error: { message: "quota" } });
    await expect(mocks.complete(event)).rejects.toThrow("could not be processed");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
