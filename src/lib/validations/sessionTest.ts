import { z } from "zod";
import { optionInputSchema } from "@/lib/validations/assessment";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";

// One test per ClassSession, served twice (PRE then POST) — so `kind` is NOT a
// field here; it lives on the attempt. See docs/plans/assessments.md.

export const createSessionTestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters."),
  instructions: z
    .string()
    .trim()
    .max(2000, "Instructions cannot exceed 2000 characters.")
    .optional()
    .or(z.literal("")),
});

export type CreateSessionTestInput = z.infer<typeof createSessionTestSchema>;

export const updateSessionTestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters.")
    .optional(),
  instructions: z
    .string()
    .trim()
    .max(2000, "Instructions cannot exceed 2000 characters.")
    .optional()
    .or(z.literal("")),
});

export type UpdateSessionTestInput = z.infer<typeof updateSessionTestSchema>;

export const setSessionTestQuestionsSchema = z.object({
  // Array order is the on-test display order, shared by both runs.
  questionIds: z
    .array(z.string().trim().min(1, "Missing question id."))
    .min(1, "A test needs at least one question.")
    .max(50, "A test can have at most 50 questions."),
});

export type SetSessionTestQuestionsInput = z.infer<typeof setSessionTestQuestionsSchema>;

export const sessionTestStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "CLOSED"], { message: "Invalid status transition." }),
});

export type SessionTestStatusInput = z.infer<typeof sessionTestStatusSchema>;

// A tutor authoring a custom question. `subject` is taken from the class; the
// route checks `topic` is one of the class's topics.
export const authorTutorQuestionSchema = z
  .object({
    classId: z.string().trim().min(1, "Missing class id."),
    topic: z.string().trim().min(1, "Topic is required."),
    prompt: z
      .string()
      .trim()
      .min(5, "Question prompt must be at least 5 characters.")
      .max(1000, "Question prompt cannot exceed 1000 characters."),
    explanation: z
      .string()
      .trim()
      .max(1000, "Explanation cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN, `Provide at least ${OPTION_COUNT_MIN} options.`)
      .max(OPTION_COUNT_MAX, `Provide at most ${OPTION_COUNT_MAX} options.`),
  })
  .refine((d) => d.options.filter((o) => o.isCorrect).length === 1, {
    message: "Mark exactly one option correct.",
    path: ["options"],
  });

export type AuthorTutorQuestionInput = z.infer<typeof authorTutorQuestionSchema>;

export const updateTutorQuestionSchema = z
  .object({
    topic: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(5).max(1000).optional(),
    explanation: z.string().trim().max(1000).optional().or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN)
      .max(OPTION_COUNT_MAX)
      .optional(),
  })
  .refine(
    (d) => d.options === undefined || d.options.filter((o) => o.isCorrect).length === 1,
    { message: "Mark exactly one option correct.", path: ["options"] }
  );

export type UpdateTutorQuestionInput = z.infer<typeof updateTutorQuestionSchema>;
