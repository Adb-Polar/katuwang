import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
const mock = vi.hoisted(() => ({ session: vi.fn(), migrate: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: mock.session }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/certificationCatalogMigration", async original => ({ ...await original<typeof import("@/lib/certificationCatalogMigration")>(), migrateCertificationCatalog: mock.migrate }));
const body = { operationId: "qa-catalog-migration", reason: "Owner authorizes replacement of retired certification topics." };
const request = (data: unknown, origin = "https://katuwang.me") => new NextRequest("https://katuwang.me/api/admin/certifications/migrate-catalog", { method: "POST", headers: { origin }, body: JSON.stringify(data) });
beforeEach(() => { vi.resetAllMocks(); mock.session.mockResolvedValue({ user: { id: "super", role: "SUPER_ADMIN" } }); mock.migrate.mockResolvedValue({ outdatedRecords: 31 }); });
describe("protected certification catalog migration", () => {
  it.each([null, { user: { role: "ADMIN" } }, { user: { role: "STUDENT_TUTOR" } }])("requires a super administrator", async session => { mock.session.mockResolvedValue(session); expect((await POST(request(body))).status).toBe(403); expect(mock.migrate).not.toHaveBeenCalled(); });
  it("rejects cross-origin requests", async () => { expect((await POST(request(body, "https://elsewhere.example"))).status).toBe(403); expect(mock.migrate).not.toHaveBeenCalled(); });
  it("defaults to a read-only preview using the signed-in actor", async () => { expect((await POST(request(body))).status).toBe(200); expect(mock.migrate).toHaveBeenCalledWith({}, { ...body, dryRun: true, adminId: "super" }); });
  it.each([{ ...body, dryRun: false }, { ...body, dryRun: false, confirmReplacement: true }])("requires confirmation and an inventory fingerprint to apply", async data => { expect((await POST(request(data))).status).toBe(400); expect(mock.migrate).not.toHaveBeenCalled(); });
  it("applies the explicit previewed operation", async () => { const input = { ...body, dryRun: false, confirmReplacement: true, expectedFingerprint: "a".repeat(64) }; expect((await POST(request(input))).status).toBe(200); expect(mock.migrate).toHaveBeenCalledWith({}, { ...input, adminId: "super" }); });
});
