import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateVerificationCode, hashVerificationCode, matchesVerificationCode, verificationCodeExpiry } from "@/lib/emailVerification";

describe("email verification codes", () => {
  beforeEach(() => vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-email-codes"));
  afterEach(() => vi.unstubAllEnvs());

  it("generates six digits and expires after ten minutes", () => {
    expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    const start = new Date("2026-01-01T00:00:00Z");
    expect(verificationCodeExpiry(start).getTime() - start.getTime()).toBe(10 * 60_000);
  });

  it("binds a salted code hash to the email and code", () => {
    const first = hashVerificationCode("user@example.com", "012345");
    const second = hashVerificationCode("user@example.com", "012345");
    expect(first).not.toBe(second);
    expect(matchesVerificationCode("USER@example.com", "012345", first)).toBe(true);
    expect(matchesVerificationCode("other@example.com", "012345", first)).toBe(false);
    expect(matchesVerificationCode("user@example.com", "123456", first)).toBe(false);
    expect(matchesVerificationCode("user@example.com", "012345", "old-link-token-hash")).toBe(false);
  });
});
