import { describe, it, expect } from "vitest";
import { registerSchema } from "@/lib/validations/auth";

function baseLearner(overrides: Record<string, unknown> = {}) {
  return {
    type: "LEARNER",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan@example.com",
    password: "password123",
    gradeLevel: "GRADE_10",
    section: "Rizal",
    consentGiven: true,
    ...overrides,
  };
}

function baseTutor(overrides: Record<string, unknown> = {}) {
  return {
    ...baseLearner(),
    type: "TUTOR",
    ...overrides,
  };
}

describe("registerSchema", () => {
  it("accepts a valid learner registration", () => {
    const result = registerSchema.safeParse(baseLearner());
    expect(result.success).toBe(true);
  });

  it("accepts a valid tutor registration", () => {
    const result = registerSchema.safeParse(baseTutor());
    expect(result.success).toBe(true);
  });

  it("lowercases and trims email", () => {
    const result = registerSchema.safeParse(
      baseLearner({ email: "  Juan@Example.COM  " })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("juan@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse(baseLearner({ email: "not-an-email" }));
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse(baseLearner({ password: "short" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing first name", () => {
    const result = registerSchema.safeParse(baseLearner({ firstName: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid grade level", () => {
    const result = registerSchema.safeParse(baseLearner({ gradeLevel: "GRADE_99" }));
    expect(result.success).toBe(false);
  });

  it("requires consentGiven to be true", () => {
    const result = registerSchema.safeParse(baseLearner({ consentGiven: false }));
    expect(result.success).toBe(false);
  });

  it("rejects when consentGiven is missing", () => {
    const { consentGiven, ...rest } = baseLearner();
    const result = registerSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("allows empty contactInfo", () => {
    const result = registerSchema.safeParse(baseLearner({ contactInfo: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects an unknown registration type", () => {
    const result = registerSchema.safeParse(baseLearner({ type: "ADMIN" }));
    expect(result.success).toBe(false);
  });
});
