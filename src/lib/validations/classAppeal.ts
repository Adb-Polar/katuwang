import { z } from "zod";

// A tutor files an appeal against a suspended/banned class.
export const createClassAppealSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please explain your appeal in at least 10 characters.")
    .max(500, "Appeal cannot exceed 500 characters."),
});

export type CreateClassAppealInput = z.infer<typeof createClassAppealSchema>;

// An admin reviews a pending appeal.
export const reviewClassAppealSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"], { message: "Invalid decision." }),
  reviewNote: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ReviewClassAppealInput = z.infer<typeof reviewClassAppealSchema>;
