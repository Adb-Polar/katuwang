import { z } from "zod";
import { GradeLevel, SubjectArea } from "@prisma/client";

/**
 * Shared registration fields validation schema.
 */
export const commonRegisterSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required.")
    .max(50, "First name cannot exceed 50 characters.")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .max(50, "Last name cannot exceed 50 characters.")
    .trim(),
  email: z.string().email("Invalid email address.").trim().lowercase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  gradeLevel: z.nativeEnum(GradeLevel, {
    message: "Invalid grade level.",
  }),
  section: z.string().min(1, "Section is required.").trim(),
  contactInfo: z.string().trim().optional().or(z.literal("")),
  consentGiven: z.literal(true, {
    message: "Parent/guardian consent is required.",
  }),
});

/**
 * Learner registration validation schema.
 */
export const learnerRegisterSchema = commonRegisterSchema.extend({
  type: z.literal("LEARNER"),
});

/**
 * Tutor registration validation schema.
 */
export const tutorRegisterSchema = commonRegisterSchema.extend({
  type: z.literal("TUTOR"),
  subjects: z.array(z.nativeEnum(SubjectArea)).optional().default([]),
  availability: z
    .array(
      z.object({
        day: z.string().min(1, "Day is required."),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)."),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)."),
      })
    )
    .optional()
    .default([]),
});

/**
 * Discriminated union schema for handling both types of registration.
 */
export const registerSchema = z.discriminatedUnion("type", [
  learnerRegisterSchema,
  tutorRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LearnerRegisterInput = z.infer<typeof learnerRegisterSchema>;
export type TutorRegisterInput = z.infer<typeof tutorRegisterSchema>;
