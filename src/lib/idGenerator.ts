import { prisma } from "./prisma";

/**
 * Generates the next sequential anonymous ID for a given role.
 * TUT-0001, TUT-0002 ... for tutors
 * STU-0001, STU-0002 ... for learners
 *
 * Uses a DB transaction/update to prevent race conditions.
 */
export async function generateAnonymousId(
  role: "TUTOR" | "LEARNER"
): Promise<string> {
  const prefix = role === "TUTOR" ? "TUT" : "STU";

  const updated = await prisma.idCounter.update({
    where: { role },
    data: { count: { increment: 1 } },
  });

  const padded = String(updated.count).padStart(4, "0");
  return `${prefix}-${padded}`;
}

/**
 * Generates the next sequential, human-friendly class code: C-0001, C-0002 ...
 * Uses the same atomic `IdCounter` increment as `generateAnonymousId`, upserting
 * the `"CLASS"` counter row so it works even on a fresh database.
 */
export async function generateClassCode(): Promise<string> {
  const updated = await prisma.idCounter.upsert({
    where: { role: "CLASS" },
    create: { role: "CLASS", count: 1 },
    update: { count: { increment: 1 } },
  });

  return `C-${String(updated.count).padStart(4, "0")}`;
}
