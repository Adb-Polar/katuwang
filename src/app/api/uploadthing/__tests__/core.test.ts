import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), update: vi.fn(), remove: vi.fn(), session: vi.fn(),
  middleware: null as unknown as () => Promise<unknown>,
  complete: null as unknown as (arg: { metadata: { userId: string; role: string }; file: { key: string; name: string; ufsUrl: string } }) => Promise<unknown>,
}));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.account, update: mocks.update } } }));
vi.mock("uploadthing/next", () => ({ createUploadthing: () => () => ({ middleware: (fn: typeof mocks.middleware) => {
  mocks.middleware = fn;
  return { onUploadComplete: (fn: typeof mocks.complete) => { mocks.complete = fn; return {}; } };
} }) }));
vi.mock("uploadthing/server", () => ({ UploadThingError: class extends Error {}, UTApi: class { deleteFiles = mocks.remove; } }));
import "@/app/api/uploadthing/core";
const event = { metadata: { userId: "qa", role: "STUDENT_TUTOR" }, file: { key: "new-file", name: "avatar-qa.webp", ufsUrl: "https://example.test/avatar.webp" } };
beforeEach(() => { vi.clearAllMocks(); mocks.remove.mockResolvedValue(undefined); });
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
  it("allows an active unlocked account callback", async () => {
    mocks.account.mockResolvedValue({ role: "STUDENT_TUTOR", status: "ACTIVE", profilePictureLocked: false });
    await mocks.complete(event);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "qa" }, data: expect.objectContaining({ imageKey: "new-file" }) }));
  });
});
