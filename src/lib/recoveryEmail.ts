import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export class RecoveryEmailError extends Error {}

/** Changing the address clears ownership; resaving the same address preserves it. */
export async function recoveryEmailUpdateData(userId: string, email: string, password?: string) {
  const value = email.trim().toLowerCase() || null;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, recoveryEmail: true, password: true } });
  if (value === user.recoveryEmail?.toLowerCase() || (value === null && user.recoveryEmail === null)) return {};
  if (!password || !(await bcrypt.compare(password, user.password))) throw new RecoveryEmailError("Enter your current password to change your recovery email.");
  if (value === user.email.toLowerCase()) throw new RecoveryEmailError("Choose a recovery address different from your primary email.");
  return { recoveryEmail: value, recoveryEmailVerifiedAt: null };
}
