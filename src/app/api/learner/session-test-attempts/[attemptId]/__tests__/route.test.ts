import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), attempt: vi.fn(), access: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { sessionTestAttempt: { findUnique: mocks.attempt } } }));
vi.mock("@/lib/sessionTestAccess", () => ({ checkLearnerAttemptAccess: mocks.access }));
import { GET } from "../route";
const load = () => GET(new NextRequest("http://localhost/api/learner/session-test-attempts/a1"), { params: Promise.resolve({ attemptId: "a1" }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "L1", role: "STUDENT_LEARNER" } });
  mocks.attempt.mockResolvedValue({ id: "a1", learnerId: "L1", kind: "PRE", status: "IN_PROGRESS", startedAt: new Date(), sessionTest: { title: "Test", instructions: null }, items: [] });
  mocks.access.mockResolvedValue(null);
});
describe("GET learner attempt", () => {
  it("returns an authorized attempt", async () => expect((await load()).status).toBe(200));
  it("does not expose another learner's attempt", async () => {
    mocks.attempt.mockResolvedValue({ learnerId: "OTHER" });
    expect((await load()).status).toBe(404);
    expect(mocks.access).not.toHaveBeenCalled();
  });
  it.each([403, 409])("does not return questions after current access fails with %s", async (status) => {
    mocks.access.mockResolvedValue({ error: "Access changed", status });
    const res = await load();
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: "Access changed" });
  });
});
