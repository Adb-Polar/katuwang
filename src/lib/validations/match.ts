import { z } from "zod";
import { SubjectArea, GradeLevel } from "@prisma/client";
import { availabilitySlotSchema } from "@/lib/validations/availability";

// A learner's preferred meeting window — same shape/rules as a tutor availability slot.
export const preferredSlotSchema = availabilitySlotSchema;

// Shared criteria used by both the matcher and the topic-request create flow.
export const matchCriteriaSchema = z.object({
  subject: z.nativeEnum(SubjectArea, { message: "Invalid subject area." }),
  topics: z
    .array(z.string().trim().min(1, "Topic cannot be empty."))
    .min(1, "Please choose at least one topic.")
    .max(10, "You can choose up to 10 topics."),
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Invalid grade level." }).optional(),
  preferredSlots: z
    .array(preferredSlotSchema)
    .max(21, "You can add up to 21 preferred time slots.")
    .optional(),
});

export type MatchCriteriaInput = z.infer<typeof matchCriteriaSchema>;

// Creating a persisted topic request: grade level is required, plus an optional note.
export const createTopicRequestSchema = matchCriteriaSchema.extend({
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Invalid grade level." }),
  note: z
    .string()
    .max(500, "Note cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type CreateTopicRequestInput = z.infer<typeof createTopicRequestSchema>;

// The only status transition a learner may make on their own request.
export const cancelTopicRequestSchema = z.object({
  status: z.literal("CANCELLED"),
});

// A tutor attaching one of their classes to an open request.
export const fulfillTopicRequestSchema = z.object({
  classId: z.string().trim().min(1, "A class is required."),
});

export type FulfillTopicRequestInput = z.infer<typeof fulfillTopicRequestSchema>;
