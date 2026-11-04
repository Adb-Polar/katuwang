import { z } from "zod";

/** `POST /api/auth/verify-email` — email and its six-digit code. */
export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email("Enter a valid email address.")),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code."),
});

/** `POST /api/auth/resend-verification` — an account's login email. */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.")),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
