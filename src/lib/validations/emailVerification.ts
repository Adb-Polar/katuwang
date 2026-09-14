import { z } from "zod";

/** `POST /api/auth/verify-email` — the emailed verification token. */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required."),
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
