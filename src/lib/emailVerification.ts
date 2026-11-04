import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { MINUTE_MS } from "@/lib/datetime";

export const VERIFICATION_CODE_TTL_MS = 10 * MINUTE_MS;

/** A six-digit code that keeps leading zeroes. */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Store a random salt and a keyed digest, never the emailed code. */
export function hashVerificationCode(email: string, code: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for email verification");
  const salt = randomBytes(16).toString("hex");
  const digest = createHmac("sha256", secret)
    .update(`${salt}:${email.toLowerCase()}:${code}`)
    .digest("hex");
  return `${salt}:${digest}`;
}

export function matchesVerificationCode(email: string, code: string, stored: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for email verification");
  const [salt, digest] = stored.split(":");
  if (!salt || !digest || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{64}$/.test(digest)) return false;
  const candidate = createHmac("sha256", secret)
    .update(`${salt}:${email.toLowerCase()}:${code}`)
    .digest();
  return timingSafeEqual(candidate, Buffer.from(digest, "hex"));
}

export function verificationCodeExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + VERIFICATION_CODE_TTL_MS);
}
