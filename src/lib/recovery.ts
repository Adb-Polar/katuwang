import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

export const RECOVERY_COOKIE = "kt-recovery";
export const RESET_COOKIE = "kt-password-reset";
export const RESET_COOKIE_PATH = "/api/auth/reset-password";
export const OWNERSHIP_SENT = "Check your selected inbox for a verification code. Enter the code to continue.";
export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export function recoveryLimit(req: NextRequest, scope: string, key?: string, cooldown = false, cooldownScope = "") {
  if (!rateLimitEnabled()) return null;
  const ip = rateLimit(`${scope}:ip:${clientIp(req.headers)}`, 10, 15 * MINUTE_MS);
  const account = key ? rateLimit(`${scope}:key:${key}`, 3, 15 * MINUTE_MS) : null;
  if (!ip.ok || (account && !account.ok)) return tooManyRequests(Math.max(ip.retryAfter, account?.retryAfter ?? 0));
  if (key && cooldown) {
    const resend = rateLimit(`${scope}:resend:${key}:${cooldownScope}`, 1, MINUTE_MS);
    if (!resend.ok) return tooManyRequests(resend.retryAfter);
  }
  return null;
}
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}
