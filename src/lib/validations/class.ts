import { z } from "zod";
import { SubjectArea } from "@prisma/client";

export const createClassSchema = z.object({
  subject: z.nativeEnum(SubjectArea, {
    message: "Invalid subject area.",
  }),
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters.")
    .max(100, "Topic cannot exceed 100 characters.")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  scheduledAt: z.string().datetime({ message: "Invalid schedule date and time." }),
  duration: z.coerce
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes.")
    .max(240, "Duration cannot exceed 4 hours."),
  maxStudents: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1 student.")
    .max(10, "Capacity cannot exceed 10 students."),
  meetingLink: z
    .string()
    .trim()
    .url("Invalid URL format.")
    .optional()
    .or(z.literal("")),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
