import { z } from "zod";
import { GradeLevel } from "@prisma/client";
import { passwordField } from "@/lib/validations/password";
import { personNameField } from "@/lib/validations/personNameField";
import { SECTION_NAME, STUDENT_ID } from "@/lib/validations/textRules";

/**
 * Shared registration fields validation schema.
 */
export const commonRegisterSchema = z.object({
  firstName: personNameField("First name", 50),
  lastName: personNameField("Last name", 50),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid email address.").max(191, "Email cannot exceed 191 characters.")),
  password: passwordField,
  recoveryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid recovery email address.").max(191, "Recovery email cannot exceed 191 characters."))
    .optional()
    .or(z.literal("")),
  gradeLevel: z.nativeEnum(GradeLevel, {
    message: "Invalid grade level.",
  }),
  studentIdNumber: z.string().trim()
    .min(1, "Student ID Number is required.")
    .max(191, "Student ID Number cannot exceed 191 characters.")
    .regex(STUDENT_ID.regex, `Student ID Number: ${STUDENT_ID.message}`),
  adviserTeacherName: personNameField("Adviser Teacher's Name", 191),
  section: z.string().trim().min(1, "Section is required.").max(50, "Section cannot exceed 50 characters.")
    .regex(SECTION_NAME.regex, `Section: ${SECTION_NAME.message}`),
  // Length-checked here; the register route normalises it with `normalizeContactInfo`
  // (PH mobile only), the same rule as profile edits.
  contactInfo: z.string().trim().max(200, "Contact info cannot exceed 200 characters.").optional().or(z.literal("")),
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
