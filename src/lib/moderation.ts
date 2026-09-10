import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/datetime";

export function computeExpiresAt(durationDays: number | undefined): Date | null {
  if (!durationDays) return null;
  return addDays(new Date(), durationDays);
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
