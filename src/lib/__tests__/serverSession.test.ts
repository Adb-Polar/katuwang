import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
const mocks = vi.hoisted(() => ({ session: vi.fn(), account: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.account } } }));
import { getActiveServerSession } from "@/lib/serverSession";
import { requireAdminSession, requireSuperAdminSession } from "@/lib/permissions";
import { GET as bank } from "@/app/api/tutor/question-bank/route";
import { NextRequest } from "next/server";

beforeEach(() => vi.resetAllMocks());
describe("live account server boundary", () => {
  for (const role of Object.values(Role)) {
    it(`accepts current active ${role} and refreshes grade/image`, async () => {
      mocks.session.mockResolvedValue({ user: { id: "qa", role, sessionVersion: 0, status: "ACTIVE", gradeLevel: "GRADE_7" } });
      mocks.account.mockResolvedValue({ role, sessionVersion: 0, status: "ACTIVE", gradeLevel: "GRADE_10", image: null });
      expect((await getActiveServerSession())?.user).toMatchObject({ role, gradeLevel: "GRADE_10", status: "ACTIVE" });
    });
    for (const status of ["SUSPENDED", "BANNED", "PENDING", "DECLINED"]) {
      it(`denies ${status} ${role} despite a cached ACTIVE JWT`, async () => {
        mocks.session.mockResolvedValue({ user: { id: "qa", role, sessionVersion: 0, status: "ACTIVE" } });
        mocks.account.mockResolvedValue({ role, status });
        expect(await getActiveServerSession()).toBeNull();
      });
    }
  }
  it.each([undefined, 0, 1])("denies legacy/stale session version %s after a password change", async (sessionVersion) => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "STUDENT_TUTOR", sessionVersion } });
    mocks.account.mockResolvedValue({ role: "STUDENT_TUTOR", status: "ACTIVE", sessionVersion: 2 });
    expect(await getActiveServerSession()).toBeNull();
  });
  it("rejects immediately when the version changes between protected requests", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "ADMIN", sessionVersion: 0 } });
    mocks.account.mockResolvedValueOnce({ role: "ADMIN", status: "ACTIVE", sessionVersion: 0 })
      .mockResolvedValueOnce({ role: "ADMIN", status: "ACTIVE", sessionVersion: 1 });
    expect(await getActiveServerSession()).not.toBeNull();
    expect(await getActiveServerSession()).toBeNull();
  });
  it("rechecks each request without a five-minute authorization cache", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "STUDENT_TUTOR", sessionVersion: 0, status: "ACTIVE" } });
    mocks.account.mockResolvedValueOnce({ role: "STUDENT_TUTOR", sessionVersion: 0, status: "ACTIVE" }).mockResolvedValueOnce({ role: "STUDENT_TUTOR", sessionVersion: 0, status: "BANNED" });
    expect(await getActiveServerSession()).not.toBeNull();
    expect(await getActiveServerSession()).toBeNull();
  });
  it("denies deleted accounts and changed roles", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "ADMIN", sessionVersion: 0, status: "ACTIVE" } });
    mocks.account.mockResolvedValueOnce(null).mockResolvedValueOnce({ role: "SUPER_ADMIN", sessionVersion: 0, status: "ACTIVE" });
    expect(await getActiveServerSession()).toBeNull();
    expect(await getActiveServerSession()).toBeNull();
  });
  it("does not query accounts for an anonymous session", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await getActiveServerSession()).toBeNull();
    expect(mocks.account).not.toHaveBeenCalled();
  });
  it("fails closed when the account store is unavailable", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "ADMIN" } });
    mocks.account.mockRejectedValue(new Error("offline"));
    await expect(getActiveServerSession()).rejects.toThrow("offline");
  });
  it("rejects banned administrators through both shared guards", async () => {
    for (const role of ["ADMIN", "SUPER_ADMIN"]) {
      mocks.session.mockResolvedValue({ user: { id: "qa", role, sessionVersion: 0, status: "ACTIVE" } });
      mocks.account.mockResolvedValue({ role, sessionVersion: 0, status: "BANNED" });
      expect((await requireAdminSession()).authorized).toBe(false);
      expect((await requireSuperAdminSession()).authorized).toBe(false);
    }
  });
  it("blocks a direct tutor API request before querying the bank", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa", role: "STUDENT_TUTOR", sessionVersion: 0, status: "ACTIVE" } });
    mocks.account.mockResolvedValue({ role: "STUDENT_TUTOR", sessionVersion: 0, status: "SUSPENDED" });
    expect((await bank(new NextRequest("http://localhost/api/tutor/question-bank"))).status).toBe(401);
  });
});
