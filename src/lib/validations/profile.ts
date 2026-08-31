import { z } from "zod";

// Self-service profile fields — the same two for tutors and learners.
export const updateProfileSchema = z.object({
  contactInfo: z.string().trim().max(200, "Contact info cannot exceed 200 characters.").optional().or(z.literal("")),
  section: z.string().trim().min(1, "Section is required.").max(50, "Section cannot exceed 50 characters.").optional(),
  recoveryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid recovery email address."))
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** @deprecated Use {@link updateProfileSchema}. Kept for existing imports. */
export const updateTutorProfileSchema = updateProfileSchema;
export type UpdateTutorProfileInput = UpdateProfileInput;
