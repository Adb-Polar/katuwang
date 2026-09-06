import { z } from "zod";
import { GradeLevel } from "@prisma/client";

export { normalizeContactInfo } from "@/lib/contactInfo";

// ─── Self-service profile fields ─────────────────────────────────────────────
// Shared by tutors and learners. `gradeLevel` is editable by the account owner
// (see docs/reference/decisions.md — grade/section are self-service).
// `contactInfo` is only length-checked here; call `normalizeContactInfo` in the
// route for format validation + normalisation.
export const updateProfileSchema = z.object({
  contactInfo: z
    .string()
    .trim()
    .max(200, "Contact info cannot exceed 200 characters.")
    .optional()
    .or(z.literal("")),
  section: z.string().trim().min(1, "Section is required.").max(50, "Section cannot exceed 50 characters.").optional(),
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Select a valid grade level." }).optional(),
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
