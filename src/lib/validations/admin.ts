import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"], {
    message: "Invalid account status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
  durationDays: z.number().int().positive().max(365, "Duration cannot exceed 365 days.").optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateClassStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "SUSPENDED", "BANNED"], {
    message: "Invalid class status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
  durationDays: z.number().int().positive().max(365, "Duration cannot exceed 365 days.").optional(),
});

export type UpdateClassStatusInput = z.infer<typeof updateClassStatusSchema>;

export const reviewCertificationSchema = z.object({
  status: z.enum(["CERTIFIED", "REJECTED"], {
    message: "Invalid certification decision.",
  }),
  reviewNote: z
    .string()
    .trim()
    .max(500, "Review note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ReviewCertificationInput = z.infer<typeof reviewCertificationSchema>;

export const updatePlatformSettingSchema = z.object({
  key: z.enum(
    [
      "requireCertificationForClassCreation",
      "registrationOpen",
      "matchingEnabled",
      "showTutorRealNames",
      "requireRegistrationApproval",
      "autoCertifyOnAssessmentPass",
    ],
    { message: "Invalid setting key." }
  ),
  value: z.boolean({ message: "Value must be a boolean." }),
});

export type UpdatePlatformSettingInput = z.infer<typeof updatePlatformSettingSchema>;

export const moderateTopicRequestSchema = z.object({
  status: z.enum(["OPEN", "CANCELLED"], { message: "Invalid topic request status." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type ModerateTopicRequestInput = z.infer<typeof moderateTopicRequestSchema>;

export const reviewRegistrationSchema = z.object({
  decision: z.enum(["APPROVE", "DECLINE"], { message: "Invalid decision." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
