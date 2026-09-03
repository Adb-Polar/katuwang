import { z } from "zod";
import { SubjectArea, GradeLevel } from "@prisma/client";
import { availabilitySlotSchema } from "@/lib/validations/availability";
import { createClassSchema } from "@/lib/validations/class";

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
  // Auto Match only: "SOLO" = 1-on-1 (maxStudents 1), "GROUP" = maxStudents > 1.
  classFormat: z.enum(["SOLO", "GROUP", "ANY"]).optional(),
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
  // Present → the request is directed at one specific tutor; absent → public (every eligible tutor sees it).
  directedTutorId: z.string().trim().min(1, "Invalid tutor.").optional(),
});

export type CreateTopicRequestInput = z.infer<typeof createTopicRequestSchema>;

// The only status transition a learner may make on their own request.
export const cancelTopicRequestSchema = z.object({
  status: z.literal("CANCELLED"),
});

// A tutor accepting a request: the body IS a class-creation payload (the accept
// route auto-creates a full class from it).
export const acceptTopicRequestSchema = createClassSchema;

export type AcceptTopicRequestInput = z.infer<typeof acceptTopicRequestSchema>;
