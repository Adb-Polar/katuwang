import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("correct horse");

    await expect(verifyPassword("correct horse", hash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword("correct horse");

    await expect(verifyPassword("wrong horse", hash)).resolves.toBe(false);
  });
});
