// Non-destructive audit probes: all authentication and database calls are mocked.
// BUG-001/002 now assert secure behavior. BUG-005 remains historical reproduction
// of a separate validation finding outside the three active backlog fixes.
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), findMany: vi.fn(), count: vi.fn(), account: vi.fn(), certifications: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.account }, topicCertification: { findMany: mocks.certifications }, assessmentQuestion: { findMany: mocks.findMany, count: mocks.count } } }));
import { GET } from "@/app/api/tutor/question-bank/route";
import { requireAdminSession } from "@/lib/permissions";
import { commonRegisterSchema } from "@/lib/validations/auth";
import { NextRequest } from "next/server";
describe("Audit defect reproduction with isolated mocks", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.certifications.mockResolvedValue([]); mocks.findMany.mockResolvedValue([{ id: "qa-question", origin: "BANK", options: [{ id: "qa-option", text: "4", isCorrect: true }] }]); mocks.count.mockResolvedValue(1); });
  it("BUG-001: suspended tutor is denied before a bank query", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa-tutor", role: "STUDENT_TUTOR", status: "SUSPENDED" } });
    mocks.account.mockResolvedValue({ role: "STUDENT_TUTOR", status: "SUSPENDED" });
    const response = await GET(new NextRequest("http://localhost/api/tutor/question-bank"));
    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
  it("BUG-002: uncertified tutor receives no qualification-bank questions or keys", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa-tutor", role: "STUDENT_TUTOR", status: "ACTIVE" } });
    mocks.account.mockResolvedValue({ role: "STUDENT_TUTOR", status: "ACTIVE" });
    const response = await GET(new NextRequest("http://localhost/api/tutor/question-bank?subject=MATH"));
    expect((await response.json()).questions).toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
  it("BUG-001: banned administrator is denied by the shared guard", async () => {
    mocks.session.mockResolvedValue({ user: { id: "qa-admin", role: "ADMIN", status: "BANNED" } });
    mocks.account.mockResolvedValue({ role: "ADMIN", status: "BANNED" });
    expect((await requireAdminSession()).authorized).toBe(false);
  });
  it("BUG-005: whitespace-only names and section pass registration schema", () => {
    const result = commonRegisterSchema.safeParse({ firstName: "   ", lastName: "   ", email: "qa@example.test", password: "AuditOnly!2026", gradeLevel: "GRADE_9", section: "   ", consentGiven: true });
    expect(result.success).toBe(true);
    if (result.success) expect([result.data.firstName, result.data.lastName, result.data.section]).toEqual(["", "", ""]);
  });
});
