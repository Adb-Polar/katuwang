import { z } from "zod";
import { passwordField } from "@/lib/validations/password";

/** `POST /api/auth/forgot-password` — the primary registered email address. */
export const forgotPasswordSchema = z.object({
  method: z.enum(["primary", "recovery"]).default("primary"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.").max(191)),
});

/** Reset authorization (from a cookie or legacy link) plus the new password. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required.").max(256),
  password: passwordField,
  // Optional for compatibility with existing reset-link API clients.
  confirmPassword: z.string().optional(),
}).refine(({ password, confirmPassword }) => confirmPassword === undefined || password === confirmPassword, {
  message: "Passwords do not match.", path: ["confirmPassword"],
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
