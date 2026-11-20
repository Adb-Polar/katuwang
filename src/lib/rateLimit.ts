import { NextResponse } from "next/server";
import { MINUTE_MS } from "@/lib/datetime";

/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Per-process only — on a multi-instance deploy each instance keeps its own
 * counters, so the effective limit is `N × instances`. That is an accepted
 * trade-off here (single-instance school deployment); swap the `Map` for Redis
 * / Upstash if the app is ever horizontally scaled.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();
let lastSweep = 0;

/** Drop expired buckets at most once a minute so the Map can't grow unbounded. */
function sweep(now: number): void {
  if (now - lastSweep < MINUTE_MS) return;
  lastSweep = now;
  for (const [key, win] of buckets) {
    if (win.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds the caller should wait before retrying (0 when `ok`). */
  retryAfter: number;
}

/** Records one hit against `key`; returns whether it is within `limit` per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const win = buckets.get(key);
  if (!win || win.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  win.count += 1;
  if (win.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((win.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Whether limiting should run. Off under Vitest (so unit tests don't trip it)
 * and when `RATE_LIMIT_DISABLED=1` is set for a local debugging session.
 */
export function rateLimitEnabled(): boolean {
  return !process.env.VITEST && process.env.RATE_LIMIT_DISABLED !== "1";
}

type HeaderBag =
  | Headers
  | Record<string, string | string[] | undefined>
  | undefined;

/** Best-effort client IP from proxy headers; `"unknown"` when nothing is set. */
export function clientIp(headers: HeaderBag): string {
  const get = (name: string): string | undefined => {
    if (!headers) return undefined;
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name) ?? undefined;
    }
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  // Cloudflare (in front of Render) overwrites CF-Connecting-IP with the real
  // client address, so a caller can't spoof it. X-Forwarded-For's first entry
  // is client-supplied and only used as a last resort (local/dev).
  const cf = get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const real = get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

/** Standard 429 response with a `Retry-After` header. */
export function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
