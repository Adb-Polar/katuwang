import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
const m = vi.hoisted(() => ({ session: vi.fn(), approve: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: m.session }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/administrativeQuestionApproval", () => ({ approveBankForAssessments: m.approve }));
const body = { reason: "The application owner authorizes this bank for tutor assessment use.", administrativeApproval: true };
const req = (data: unknown) => new NextRequest("https://katuwang.me/api/admin/assessment-questions/approve-bank", { method: "POST", body: JSON.stringify(data) });
beforeEach(() => { vi.resetAllMocks(); m.session.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } }); m.approve.mockResolvedValue({ approvedQuestions: 5840, academicReviewAttested: false }); });
describe("administrator assessment approval", () => {
  it.each([null, { user: { id: "tutor", role: "STUDENT_TUTOR" } }, { user: { id: "learner", role: "STUDENT_LEARNER" } }])("rejects unauthorized callers before touching the bank", async session => { m.session.mockResolvedValue(session); expect((await POST(req(body))).status).toBe(401); expect(m.approve).not.toHaveBeenCalled(); });
  it.each([{}, { ...body, reason: "Short" }, { ...body, administrativeApproval: false }])("requires explicit approval and a substantive reason", async data => { expect((await POST(req(data))).status).toBe(400); expect(m.approve).not.toHaveBeenCalled(); });
  it("uses the authenticated administrator and records administrative provenance", async () => { const response = await POST(req(body)); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ approvedQuestions: 5840, academicReviewAttested: false }); expect(m.approve).toHaveBeenCalledWith({}, "admin1", body.reason, false); });
  it("supports a preview without writing approvals", async () => { expect((await POST(req({ ...body, dryRun: true }))).status).toBe(200); expect(m.approve).toHaveBeenCalledWith({}, "admin1", body.reason, true); });
});
