import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ update: vi.fn(), find: vi.fn(), render: vi.fn(), send: vi.fn(), configured: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { completionCertificate: { updateMany: mocks.update, findUnique: mocks.find, findUniqueOrThrow: mocks.find } } }));
vi.mock("../pdf", () => ({ generateCertificatePdf: mocks.render }));
vi.mock("@/lib/mail", () => ({ isMailConfigured: mocks.configured, sendMail: mocks.send }));
import { processCertificate } from "../jobs";
const row = { id: "c1", learner: { email: "registered@example.test" }, learnerName: "Ana Reyes", tutorName: "Juan Cruz", subjectName: "Math", classCode: "CLS-1", certificateNumber: "KTW-123", completedAt: new Date(), issuedAt: new Date(), pdf: null, attempts: 1 };
beforeEach(() => { vi.clearAllMocks(); mocks.update.mockResolvedValue({ count: 1 }); mocks.find.mockResolvedValue({ ...row }); mocks.render.mockResolvedValue(new Uint8Array([37, 80, 68, 70])); mocks.send.mockResolvedValue(undefined); mocks.configured.mockReturnValue(true); });
describe("durable certificate delivery", () => {
  it("persists a PDF and sends it only to the learner's registered email", async () => {
    expect(await processCertificate("c1")).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ pdf: expect.any(Uint8Array) }) }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: row.learner.email, subject: "Katuwang - Your Certificate of Completion", attachments: [{ filename: "KTW-123.pdf", content: expect.any(Uint8Array), contentType: "application/pdf" }] }));
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ emailStatus: "SENT", nextAttemptAt: null }) }));
  });
  it("does nothing when another worker already owns or completed delivery", async () => {
    mocks.update.mockResolvedValueOnce({ count: 0 }); expect(await processCertificate("c1")).toBe(false);
    expect(mocks.render).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it("records mail failure and a retry without generating a new certificate or discarding its PDF", async () => {
    mocks.send.mockRejectedValueOnce(Error("secret provider response")); expect(await processCertificate("c1")).toBe(false);
    const failure = mocks.update.mock.calls.at(-1)![0].data;
    expect(failure).toMatchObject({ emailStatus: "FAILED", nextAttemptAt: expect.any(Date), leaseToken: null });
    expect(JSON.stringify(failure)).not.toContain("secret"); expect(failure).not.toHaveProperty("pdf");
  });
  it("reuses an existing PDF on retry", async () => {
    const pdf = new Uint8Array([37, 80, 68, 70]); mocks.find.mockResolvedValue({ ...row, pdf }); await processCertificate("c1");
    expect(mocks.render).not.toHaveBeenCalled(); expect(mocks.send.mock.calls[0][0].attachments[0].content).toBe(pdf);
  });
  it("retains a downloadable PDF and records failure when mail is unconfigured", async () => {
    mocks.configured.mockReturnValue(false); expect(await processCertificate("c1")).toBe(false); expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls.at(-1)![0].data.emailStatus).toBe("FAILED");
  });
  it("records PDF errors without sending mail and stops automatic retries after five attempts", async () => {
    mocks.find.mockResolvedValue({ ...row, attempts: 5 }); mocks.render.mockRejectedValueOnce(Error("invalid font"));
    expect(await processCertificate("c1")).toBe(false); expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls.at(-1)![0].data).toMatchObject({ emailStatus: "FAILED", nextAttemptAt: null, lastError: expect.stringContaining("PDF generation") });
  });
});
