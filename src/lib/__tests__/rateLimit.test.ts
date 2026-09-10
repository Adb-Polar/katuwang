import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, clientIp } from "@/lib/rateLimit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit()", () => {
  it("allows exactly `limit` hits per window, then blocks", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 1, 1_000).ok).toBe(true);
    expect(rateLimit(key, 1, 1_000).ok).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, 1, 1_000).ok).toBe(true);
  });

  it("keys are independent", () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });
});

describe("clientIp()", () => {
  it("reads the first x-forwarded-for entry from a Headers object", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(h)).toBe("203.0.113.7");
  });

  it("reads x-forwarded-for from a plain header bag", () => {
    expect(clientIp({ "x-forwarded-for": "198.51.100.4" })).toBe("198.51.100.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp({ "x-real-ip": "198.51.100.9" })).toBe("198.51.100.9");
    expect(clientIp({})).toBe("unknown");
    expect(clientIp(undefined)).toBe("unknown");
  });
});
