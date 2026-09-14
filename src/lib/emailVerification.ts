import { createHash, randomBytes } from "crypto";
import { HOUR_MS } from "@/lib/datetime";

/**
 * Email-verification token helpers, mirroring src/lib/passwordReset.ts: the raw
 * token only ever appears in the emailed link, and the database stores its
 * SHA-256 hash so a leaked table row can't be used to verify an account.
 */

/** How long an issued verification token stays valid. */
export const VERIFICATION_TOKEN_TTL_MS = 24 * HOUR_MS;

/** Cryptographically-random raw token for the emailed link. */
export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stable hash of a raw token, for storage and lookup. */
export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Absolute expiry for a token issued `from` now (or a supplied clock). */
export function verificationTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + VERIFICATION_TOKEN_TTL_MS);
}
