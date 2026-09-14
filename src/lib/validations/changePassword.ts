import { z } from "zod";
import { passwordField } from "@/lib/validations/password";

/** `POST /api/{role}/profile/password` — current + new password. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordField,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
