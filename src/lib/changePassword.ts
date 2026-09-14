import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ChangeOwnPasswordResult =
  | { ok: true }
  | { ok: false; code: "USER_NOT_FOUND" | "WRONG_CURRENT_PASSWORD" };

/**
 * Shared core for a user changing their own password — used identically by the
 * learner/tutor/admin password routes. Verifies `currentPassword` before
 * hashing and storing `newPassword` (bcrypt cost 12, same as elsewhere).
 */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangeOwnPasswordResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) return { ok: false, code: "USER_NOT_FOUND" };

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) return { ok: false, code: "WRONG_CURRENT_PASSWORD" };

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

  return { ok: true };
}
