import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { generateCertificatePdf } from "./pdf";
import { certificateEmail } from "./email";

const MAX_ATTEMPTS = 5;
const LEASE_MS = 5 * 60_000;
export function dueCertificates(now: Date) {
  return {
    OR: [
      { emailStatus: { in: ["PENDING", "FAILED"] as ("PENDING" | "FAILED")[] }, attempts: { lt: MAX_ATTEMPTS }, nextAttemptAt: { lte: now } },
      { emailStatus: "PROCESSING" as const, leaseExpiresAt: { lt: now } },
    ],
  };
}

/** Claim by compare-and-set: concurrent workers/retries cannot own the same delivery. */
export async function processCertificate(id: string) {
  const token = randomUUID(), now = new Date();
  const claim = await prisma.completionCertificate.updateMany({
    where: { id, ...dueCertificates(now) },
    data: { emailStatus: "PROCESSING", leaseToken: token, leaseExpiresAt: new Date(now.getTime() + LEASE_MS), attempts: { increment: 1 } },
  });
  if (claim.count !== 1) return false;
  let stage = "PDF generation";
  try {
    const c = await prisma.completionCertificate.findUniqueOrThrow({ where: { id }, include: { learner: { select: { email: true } } } });
    const pdf = c.pdf ?? new Uint8Array(await generateCertificatePdf(c));
    if (!c.pdf) {
      const saved = await prisma.completionCertificate.updateMany({ where: { id, leaseToken: token }, data: { pdf } });
      if (saved.count !== 1) return false;
    }
    stage = "Email delivery";
    if (!isMailConfigured()) throw new Error("Email is not configured");
    await sendMail({ to: c.learner.email, ...certificateEmail(c), attachments: [{ filename: `${c.certificateNumber}.pdf`, content: pdf, contentType: "application/pdf" }] });
    await prisma.completionCertificate.updateMany({
      where: { id, leaseToken: token },
      data: { emailStatus: "SENT", emailSentAt: new Date(), lastError: null, nextAttemptAt: null, leaseToken: null, leaseExpiresAt: null },
    });
    return true;
  } catch {
    // Store a useful stage, never transport response bodies, recipient details, or credentials.
    const c = await prisma.completionCertificate.findUnique({ where: { id }, select: { attempts: true } });
    await prisma.completionCertificate.updateMany({
      where: { id, leaseToken: token },
      data: { emailStatus: "FAILED", lastError: `${stage} failed. Check service configuration and retry.`,
        nextAttemptAt: c && c.attempts < MAX_ATTEMPTS ? new Date(Date.now() + Math.min(60, 2 ** c.attempts) * 60_000) : null,
        leaseToken: null, leaseExpiresAt: null },
    });
    return false;
  }
}

/** Bounded batches for after-response work, the authenticated scheduler, and the worker CLI. */
export async function processCertificateJobs(limit = 10, classId?: string) {
  const rows = await prisma.completionCertificate.findMany({
    where: { ...dueCertificates(new Date()), ...(classId ? { classId } : {}) },
    select: { id: true }, orderBy: { issuedAt: "asc" }, take: Math.max(1, Math.min(50, limit)),
  });
  let sent = 0;
  for (let i = 0; i < rows.length; i += 2) {
    const results = await Promise.all(rows.slice(i, i + 2).map(row => processCertificate(row.id)));
    sent += results.filter(Boolean).length;
  }
  return { processed: rows.length, sent };
}
