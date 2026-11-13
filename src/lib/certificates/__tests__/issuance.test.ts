import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { issueClassCertificates } from "../issuance";
const snapshot = () => ({ status: "COMPLETED", completedAt: new Date("2026-11-09T08:00:00Z"), subject: "MATH", code: "CLS-1", sessions: [{ status: "COMPLETED" }], tutorProfile: { user: { id: "t1", firstName: "Juan", lastName: "Cruz" } }, enrollments: [{ learner: { id: "l1", firstName: "María", lastName: "Peña" } }, { learner: { id: "l2", firstName: "Ana", lastName: "Reyes" } }] });
function database(cls = snapshot()) {
  const createMany = vi.fn();
  const tx = { tutorClass: { findUnique: vi.fn().mockResolvedValue(cls) }, subject: { findUnique: vi.fn().mockResolvedValue({ name: "Mathematics" }) }, completionCertificate: { createMany } };
  return { tx, createMany, db: tx as unknown as Prisma.TransactionClient };
}
describe("completion certificate issuance", () => {
  it("snapshots all active learners and tutor/subject details with duplicate-safe insertion", async () => {
    const m = database(); await issueClassCertificates(m.db, "class1");
    expect(m.tx.tutorClass.findUnique.mock.calls[0][0].include.enrollments.where).toEqual({ withdrawnAt: null, learner: { role: "STUDENT_LEARNER" } });
    const { data, skipDuplicates } = m.createMany.mock.calls[0][0];
    expect(skipDuplicates).toBe(true); expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ learnerId: "l1", tutorId: "t1", classId: "class1", learnerName: "María Peña", tutorName: "Juan Cruz", subjectName: "Mathematics" });
    expect(data[0].certificateNumber).toMatch(/^KTW-[A-F0-9]{32}$/);
    expect(data[0].certificateNumber).not.toBe(data[1].certificateNumber);
  });
  it.each(["SCHEDULED", "CANCELLED", "SUSPENDED", "BANNED"])("does not issue for %s classes", async status => {
    const m = database({ ...snapshot(), status }); await issueClassCertificates(m.db, "class1"); expect(m.createMany).not.toHaveBeenCalled();
  });
  it("does not infer completion from scheduled time or incomplete sessions", async () => {
    const m = database({ ...snapshot(), sessions: [{ status: "COMPLETED" }, { status: "SCHEDULED" }] });
    await issueClassCertificates(m.db, "class1"); expect(m.createMany).not.toHaveBeenCalled();
  });
  it("does not backfill unconfirmed legacy completions", async () => {
    const m = database({ ...snapshot(), completedAt: null } as unknown as ReturnType<typeof snapshot>);
    await issueClassCertificates(m.db, "class1"); expect(m.createMany).not.toHaveBeenCalled();
  });
  it("does not issue for all-cancelled sessions", async () => {
    const m = database({ ...snapshot(), sessions: [{ status: "CANCELLED" }] }); await issueClassCertificates(m.db, "class1"); expect(m.createMany).not.toHaveBeenCalled();
  });
});
