import { z } from "zod";
import { passwordField } from "@/lib/validations/password";

/** `POST /api/auth/forgot-password` — an email address (primary or recovery). */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.")),
});

/** `POST /api/auth/reset-password` — the emailed token plus the new password. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: passwordField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
