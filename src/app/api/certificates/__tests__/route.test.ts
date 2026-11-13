import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn(), count: vi.fn(), find: vi.fn(), update: vi.fn(), schedule: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: m.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { completionCertificate: { findMany: m.list, count: m.count, findUnique: m.find, updateMany: m.update } } }));
vi.mock("@/lib/certificates/background", () => ({ scheduleCertificateJobs: m.schedule }));
import { GET as list } from "../route";
import { GET as download } from "../[certificateId]/download/route";
import { POST as retry } from "../../admin/completion-certificates/[certificateId]/retry/route";
const req = (query = "") => new NextRequest(`http://localhost/api/certificates${query}`);
const params = { params: Promise.resolve({ certificateId: "c1" }) };
beforeEach(() => { vi.clearAllMocks(); m.session.mockResolvedValue({ user: { id: "l1", role: "STUDENT_LEARNER" } }); m.list.mockResolvedValue([]); m.count.mockResolvedValue(0); m.update.mockResolvedValue({ count: 1 }); });
describe("private certificate APIs", () => {
  it("restricts learner queries even if another learner ID is supplied", async () => {
    expect((await list(req("?learnerId=l2"))).status).toBe(200);
    expect(m.list.mock.calls[0][0].where.learnerId).toBe("l1");
    expect(m.list.mock.calls[0][0].select).not.toHaveProperty("pdf");
    expect(m.list.mock.calls[0][0].select).not.toHaveProperty("learner");
  });
  it("supports admin learner search, class, subject and Philippine issue date filters", async () => {
    m.session.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    expect((await list(req("?q=Ana&subject=Math&classCode=CLS-1&issuedFrom=2026-11-09&issuedTo=2026-11-09"))).status).toBe(200);
    const where = m.list.mock.calls[0][0].where;
    expect(where.learnerId).toBeUndefined(); expect(where.classCode).toEqual({ contains: "CLS-1" });
    expect(where.issuedAt).toEqual({ gte: new Date("2026-11-08T16:00:00Z"), lt: new Date("2026-11-09T16:00:00Z") });
  });
  it.each([null, { user: { id: "t1", role: "STUDENT_TUTOR" } }])("denies unauthenticated and tutor lists", async user => {
    m.session.mockResolvedValue(user); expect((await list(req())).status).toBe(401); expect(m.list).not.toHaveBeenCalled();
  });
  it("rejects invalid date ranges and pagination", async () => {
    expect((await list(req("?issuedFrom=2026-11-10&issuedTo=2026-11-09"))).status).toBe(400);
    expect((await list(req("?pageSize=999"))).status).toBe(400); expect(m.list).not.toHaveBeenCalled();
  });
  it("does not reveal or load another learner's PDF", async () => {
    m.find.mockResolvedValue({ learnerId: "l2", certificateNumber: "KTW-123" });
    expect((await download(req(), params)).status).toBe(404); expect(m.find).toHaveBeenCalledTimes(1);
  });
  it.each(["STUDENT_LEARNER", "ADMIN", "SUPER_ADMIN"])("allows an authorized %s to download a private PDF", async role => {
    m.session.mockResolvedValue({ user: { id: "l1", role } });
    m.find.mockResolvedValueOnce({ learnerId: "l1", certificateNumber: "KTW-123" }).mockResolvedValueOnce({ pdf: new Uint8Array([37, 80, 68, 70]) });
    const res = await download(req(), params); expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf"); expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("Content-Disposition")).toContain("KTW-123.pdf");
  });
  it("returns a preparation status when the PDF isn't ready", async () => {
    m.find.mockResolvedValueOnce({ learnerId: "l1", certificateNumber: "KTW-123" }).mockResolvedValueOnce({ pdf: null });
    expect((await download(req(), params)).status).toBe(409);
  });
  it("only allows admins to retry failed deliveries and never creates a new certificate", async () => {
    expect((await retry(req(), params)).status).toBe(401); expect(m.update).not.toHaveBeenCalled();
    m.session.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    expect((await retry(req(), params)).status).toBe(202);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "c1", emailStatus: "FAILED" } }));
    expect(m.schedule).toHaveBeenCalledOnce();
    m.update.mockResolvedValueOnce({ count: 0 }); expect((await retry(req(), params)).status).toBe(409);
  });
});
