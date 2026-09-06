import { describe, it, expect } from "vitest";
import { normalizeContactInfo } from "@/lib/contactInfo";

describe("normalizeContactInfo", () => {
  it("accepts an empty string", () => {
    expect(normalizeContactInfo("")).toEqual({ ok: true, value: "" });
    expect(normalizeContactInfo("   ")).toEqual({ ok: true, value: "" });
  });

  it("normalises PH mobile numbers to the local 09XXXXXXXXX form", () => {
    expect(normalizeContactInfo("0917 123 4567")).toEqual({ ok: true, value: "09171234567" });
    expect(normalizeContactInfo("+63 917 123 4567")).toEqual({ ok: true, value: "09171234567" });
    expect(normalizeContactInfo("63-917-123-4567")).toEqual({ ok: true, value: "09171234567" });
    expect(normalizeContactInfo("(0917) 123-4567")).toEqual({ ok: true, value: "09171234567" });
  });

  it("rejects phone-like input that is not a valid PH mobile number", () => {
    expect(normalizeContactInfo("123").ok).toBe(false);
    expect(normalizeContactInfo("0917 123 456").ok).toBe(false);
    expect(normalizeContactInfo("+1 555 000 1111").ok).toBe(false);
  });

  it("keeps a free-form handle as-is", () => {
    expect(normalizeContactInfo("  Juan's mom on Messenger  ")).toEqual({
      ok: true,
      value: "Juan's mom on Messenger",
    });
  });

  it("rejects a handle that is too short", () => {
    expect(normalizeContactInfo("ab").ok).toBe(false);
  });

  it("rejects contact info over 200 characters", () => {
    expect(normalizeContactInfo("a".repeat(201)).ok).toBe(false);
  });
});
