import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/tutor/classes/[classId]/route";
import { processCertificate } from "../jobs";
import { POST as retry } from "@/app/api/admin/completion-certificates/[certificateId]/retry/route";
import { GET as download } from "@/app/api/certificates/[certificateId]/download/route";
const context = new AsyncLocalStorage<{ user: { id: string; role: string } }>();
const mail = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/serverSession", () => ({ getActiveServerSession: async () => context.getStore() ?? null }));
vi.mock("@/lib/certificates/background", () => ({ scheduleCertificateJobs: vi.fn() }));
vi.mock("@/lib/mail", () => ({ sendMail: mail.send, isMailConfigured: () => true }));

describe.skipIf(!process.env.TEST_DATABASE_URL)("real MariaDB completion certificate lifecycle", () => {
  const users: string[] = [];
  let tutorProfileId: string, classId: string;
  const as = <T>(id: string, role: string, fn: () => T) => context.run({ user: { id, role } }, fn);
  const complete = () => as(users[0], "STUDENT_TUTOR", () => PATCH(new NextRequest("http://localhost/qa", { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }), { params: Promise.resolve({ classId }) }));
  const find = () => prisma.completionCertificate.findMany({ where: { classId }, orderBy: { learnerId: "asc" } });
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("verification")) throw Error("Use an isolated local verification database.");
    const suffix = randomUUID().slice(0, 8);
    for (let i = 0; i < 4; i++) {
      const user = await prisma.user.create({ data: { anonymousId: `CERT-${suffix}-${i}`, email: `cert-${suffix}-${i}@example.test`, password: "unused", firstName: "María", lastName: `Peña ${i}`, role: i === 0 ? "STUDENT_TUTOR" : "STUDENT_LEARNER", gradeLevel: "GRADE_10", section: "QA" } });
      users.push(user.id);
    }
    const profile = await prisma.tutorProfile.create({ data: { userId: users[0] } }); tutorProfileId = profile.id;
    const cls = await prisma.tutorClass.create({ data: { code: `CERT-${suffix}`, subject: "MATH", tutorProfileId, sessions: { create: [{ topic: "Fractions", scheduledAt: new Date(Date.now() - 86400_000), duration: 60 }, { topic: "Decimals", scheduledAt: new Date(Date.now() - 3600_000), duration: 60 }] }, enrollments: { create: users.slice(1).map((learnerId, i) => ({ learnerId, ...(i === 2 ? { withdrawnAt: new Date() } : {}) })) } } }); classId = cls.id;
  });
  beforeEach(async () => {
    mail.send.mockReset().mockResolvedValue(undefined);
    await prisma.completionCertificate.deleteMany({ where: { classId } });
    await prisma.notification.deleteMany({ where: { userId: { in: users } } });
    await prisma.tutorClass.update({ where: { id: classId }, data: { status: "SCHEDULED", completedAt: null } });
    await prisma.classSession.updateMany({ where: { classId }, data: { status: "SCHEDULED" } });
  });
  afterAll(async () => {
    if (classId) { await prisma.completionCertificate.deleteMany({ where: { classId } }); await prisma.tutorClass.delete({ where: { id: classId } }); }
    if (tutorProfileId) await prisma.tutorProfile.delete({ where: { id: tutorProfileId } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  });
  it("does not issue from elapsed time or an individual session completion", async () => {
    expect(await find()).toHaveLength(0);
    await prisma.classSession.updateMany({ where: { classId, topic: "Fractions" }, data: { status: "COMPLETED" } });
    expect(await find()).toHaveLength(0);
  });
  it("atomically issues once per active learner across repeated/concurrent Finish Class requests", async () => {
    const responses = await Promise.all([complete(), complete()]); expect(responses.map(r => r.status)).toEqual([200, 200]);
    const certificates = await find(); expect(certificates).toHaveLength(2);
    expect(certificates.map(c => c.learnerId).sort()).toEqual(users.slice(1, 3).sort());
    expect(new Set(certificates.map(c => c.certificateNumber)).size).toBe(2);
    expect(certificates[0].completedAt).toEqual((await prisma.tutorClass.findUniqueOrThrow({ where: { id: classId } })).completedAt);
    expect(await prisma.notification.count({ where: { userId: { in: users }, type: "CLASS_COMPLETED" } })).toBe(2);
    await expect(prisma.completionCertificate.create({ data: { ...certificates[0], id: undefined, certificateNumber: "KTW-DUPLICATE" } })).rejects.toMatchObject({ code: "P2002" });
  });
  it("generates a persisted PDF, sends one mocked attachment per learner, and allows only owner/admin download", async () => {
    expect((await complete()).status).toBe(200);
    const records = await find();
    await Promise.all(records.map(c => processCertificate(c.id)));
    const ready = await find(); expect(ready.every(c => c.pdf && c.emailStatus === "SENT")).toBe(true);
    expect(mail.send).toHaveBeenCalledTimes(2);
    expect(mail.send.mock.calls.every(([m]) => m.attachments[0].filename.endsWith(".pdf"))).toBe(true);
    const cert = ready[0], params = { params: Promise.resolve({ certificateId: cert.id }) };
    const req = new NextRequest("http://localhost/qa");
    expect((await as(cert.learnerId, "STUDENT_LEARNER", () => download(req, params))).status).toBe(200);
    expect((await as(users[3], "STUDENT_LEARNER", () => download(req, params))).status).toBe(404);
    expect((await as("qa-admin", "ADMIN", () => download(req, params))).status).toBe(200);
    await Promise.all(records.map(c => processCertificate(c.id))); expect(mail.send).toHaveBeenCalledTimes(2);
  });
  it("retains completion and PDF on email failure, then retries the same record without reissuing", async () => {
    expect((await complete()).status).toBe(200); const [cert] = await find();
    mail.send.mockRejectedValueOnce(Error("Provider unavailable")); await processCertificate(cert.id);
    const failed = await prisma.completionCertificate.findUniqueOrThrow({ where: { id: cert.id } });
    expect(failed.emailStatus).toBe("FAILED"); expect(failed.pdf).not.toBeNull();
    expect((await prisma.tutorClass.findUniqueOrThrow({ where: { id: classId } })).status).toBe("COMPLETED");
    const response = await as("qa-admin", "ADMIN", () => retry(new NextRequest("http://localhost/qa", { method: "POST" }), { params: Promise.resolve({ certificateId: cert.id }) })); expect(response.status).toBe(202);
    await processCertificate(cert.id);
    const sent = await prisma.completionCertificate.findUniqueOrThrow({ where: { id: cert.id } });
    expect(sent.emailStatus).toBe("SENT"); expect(sent.certificateNumber).toBe(cert.certificateNumber); expect(sent.pdf).toEqual(failed.pdf); expect(await find()).toHaveLength(2);
  });
  it("prevents duplicate workers from sending the same job concurrently", async () => {
    await complete(); const [c] = await find();
    const results = await Promise.all([processCertificate(c.id), processCertificate(c.id)]);
    expect(results.filter(Boolean)).toHaveLength(1); expect(mail.send).toHaveBeenCalledOnce();
  });
  it("rejects cancelled/all-cancelled classes and unauthorized completions", async () => {
    await prisma.tutorClass.update({ where: { id: classId }, data: { status: "CANCELLED" } });
    expect((await complete()).status).toBe(409); expect(await find()).toHaveLength(0);
    await prisma.tutorClass.update({ where: { id: classId }, data: { status: "SCHEDULED" } });
    await prisma.classSession.updateMany({ where: { classId }, data: { status: "CANCELLED" } });
    expect((await complete()).status).toBe(400);
    const request = () => new NextRequest("http://localhost/qa", { method: "PATCH", body: '{"status":"COMPLETED"}' });
    expect((await as(users[1], "STUDENT_LEARNER", () => PATCH(request(), { params: Promise.resolve({ classId }) }))).status).toBe(401);
    expect((await as(users[1], "STUDENT_TUTOR", () => PATCH(request(), { params: Promise.resolve({ classId }) }))).status).toBe(403);
  });
  it("preserves issued snapshots after class/profile edits", async () => {
    await complete(); const [c] = await find();
    await prisma.tutorClass.update({ where: { id: classId }, data: { subject: "SCIENCE" } });
    await prisma.user.update({ where: { id: c.learnerId }, data: { firstName: "Changed" } });
    const saved = await prisma.completionCertificate.findUniqueOrThrow({ where: { id: c.id } });
    expect(saved.learnerName).toBe(c.learnerName); expect(saved.subjectName).toBe(c.subjectName);
    await prisma.tutorClass.update({ where: { id: classId }, data: { subject: "MATH" } });
  });
});
