import { prisma } from "@/lib/prisma";

export function computeExpiresAt(durationDays: number | undefined): Date | null {
  if (!durationDays) return null;
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
}

// Lazily lifts any class suspensions whose duration has elapsed — there is no
// background job in this app, so this runs on the learner-facing read paths
// where a suspended class's visibility/enrollability actually matters.
export async function reinstateExpiredClasses() {
  await prisma.tutorClass.updateMany({
    where: { status: "SUSPENDED", suspendedUntil: { lte: new Date() } },
    data: { status: "SCHEDULED", suspendedReason: null, suspendedUntil: null },
  });
}
