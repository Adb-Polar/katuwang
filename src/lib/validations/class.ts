import { z } from "zod";
import { SessionStatus, GradeLevel } from "@prisma/client";

// `subject` is a slug from the admin-managed taxonomy — routes verify it
// exists via src/lib/subjects.ts (`subjectExists` / `topicExists`).
const subjectSlug = z.string().trim().min(1, "Subject is required.");

export const sessionSchema = z.object({
  topic: z.string().trim().min(1, "Session topic is required."),
  scheduledAt: z.string().datetime({ message: "Invalid schedule date and time." }),
  duration: z.coerce
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes.")
    .max(240, "Duration cannot exceed 4 hours."),
});

export type SessionInput = z.infer<typeof sessionSchema>;

export const classDetailsSchema = z.object({
  subject: subjectSlug,
  gradeLevel: z
    .nativeEnum(GradeLevel, { message: "Invalid grade level." })
    .nullable()
    .optional(),
  topics: z
    .array(
      z
        .string()
        .trim()
        .min(2, "A topic needs at least 2 characters.")
        .max(60, "A topic cannot exceed 60 characters.")
    )
    .min(1, "Please select at least one topic.")
    .max(10, "You can select up to 10 topics."),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  maxStudents: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1 student.")
    .max(10, "Capacity cannot exceed 10 students."),
  building: z
    .string()
    .max(100, "Building cannot exceed 100 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  room: z
    .string()
    .max(50, "Room cannot exceed 50 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  meetingLink: z
    .string()
    .trim()
    .url("Invalid URL format.")
    .optional()
    .or(z.literal("")),
  published: z.boolean().optional(),
});

export type ClassDetailsInput = z.infer<typeof classDetailsSchema>;

export const createClassSchema = classDetailsSchema.extend({
  sessions: z
    .array(sessionSchema)
    .min(1, "Please add at least one session.")
    .max(20, "You can add up to 20 sessions at once."),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const addSessionSchema = sessionSchema;

export type AddSessionInput = z.infer<typeof addSessionSchema>;

export const updateSessionSchema = sessionSchema.partial().extend({
  status: z.nativeEnum(SessionStatus, { message: "Invalid session status." }).optional(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
