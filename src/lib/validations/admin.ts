import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"], {
    message: "Invalid account status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateClassStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "SUSPENDED"], {
    message: "Invalid class status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type UpdateClassStatusInput = z.infer<typeof updateClassStatusSchema>;
