import { z } from "zod";

// bcrypt silently truncates at 72 bytes, so anything longer is a footgun
// (two different passwords can hash equal). Cap it at the schema.
const BCRYPT_MAX_BYTES = 72;

// A short blocklist of the passwords that dominate every credential-stuffing
// list. Not a substitute for a breach-corpus check, just cheap low-hanging fruit.
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "qwerty123",
  "qwertyuiop",
  "1q2w3e4r",
  "abcd1234",
  "iloveyou",
  "welcome1",
  "welcome123",
  "admin123",
  "letmein1",
  "changeme",
]);

/** Shared password rule for registration and password reset. */
export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= BCRYPT_MAX_BYTES, {
    message: "Password must be 72 bytes or fewer.",
  })
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "That password is too common. Choose something less predictable.",
  });
