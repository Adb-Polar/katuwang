import { createHash, randomBytes } from "crypto";
import { MINUTE_MS } from "@/lib/datetime";

/**
 * Password-reset token helpers. The raw token is a 64-char hex string that only
 * ever appears in the emailed link; the database stores its SHA-256 hash so a
 * leaked table row can't be used to reset an account.
 */

/** How long an issued reset token stays valid. */
export const RESET_TOKEN_TTL_MS = 30 * MINUTE_MS;

/** Cryptographically-random raw token for the emailed link. */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stable hash of a raw token, for storage and lookup. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Absolute expiry for a token issued `from` now (or a supplied clock). */
export function resetTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESET_TOKEN_TTL_MS);
}
