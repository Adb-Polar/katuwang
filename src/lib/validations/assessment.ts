import { z } from "zod";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";

// ─── Question bank (admin) ───────────────────────────────────────────────────

export const optionInputSchema = z.object({
  text: z.string().trim().min(1, "Option text is required.").max(500, "Option text is too long."),
  isCorrect: z.boolean(),
});

export const createAssessmentQuestionSchema = z
  .object({
    subject: z.string().trim().min(1, "Subject is required."),
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

export type CreateAssessmentQuestionInput = z.infer<typeof createAssessmentQuestionSchema>;

// Full edit (pre-use) OR a lone `active` toggle (post-use). Route enforces which.
export const updateAssessmentQuestionSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(5, "Question prompt must be at least 5 characters.")
      .max(1000, "Question prompt cannot exceed 1000 characters.")
      .optional(),
    explanation: z
      .string()
      .trim()
      .max(1000, "Explanation cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN, `Provide at least ${OPTION_COUNT_MIN} options.`)
      .max(OPTION_COUNT_MAX, `Provide at most ${OPTION_COUNT_MAX} options.`)
      .optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (d) => d.options === undefined || d.options.filter((o) => o.isCorrect).length === 1,
    { message: "Mark exactly one option correct.", path: ["options"] }
  );

export type UpdateAssessmentQuestionInput = z.infer<typeof updateAssessmentQuestionSchema>;

// ─── Global assessment config (admin) ──────────────────────────────────────
// One platform-wide value per field; applies to every subject and topic.

export const updateGlobalAssessmentConfigSchema = z
  .object({
    questionCount: z.coerce.number().int().min(1, "At least 1 question.").max(50, "At most 50 questions.").optional(),
    passPercent: z.coerce.number().int().min(1, "Pass mark must be 1-100.").max(100, "Pass mark must be 1-100.").optional(),
    minBankSize: z.coerce.number().int().min(1, "At least 1.").max(200, "At most 200.").optional(),
  })
  .refine((d) => d.questionCount !== undefined || d.passPercent !== undefined || d.minBankSize !== undefined, {
    message: "Provide at least one setting to update.",
  });

export type UpdateGlobalAssessmentConfigInput = z.infer<typeof updateGlobalAssessmentConfigSchema>;

// ─── Taking an assessment (tutor) ───────────────────────────────────────────

export const startAssessmentSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
});

export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;

export const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1, "Missing question id."),
        optionId: z.string().trim().min(1, "Missing option id."),
      })
    )
    .min(1, "Answer at least one question.")
    .max(50, "Too many answers."),
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

// ─── Question requests ──────────────────────────────────────────────────────

export const requestQuestionsSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
  note: z.string().trim().max(500, "Note cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type RequestQuestionsInput = z.infer<typeof requestQuestionsSchema>;

export const resolveQuestionRequestSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"], { message: "Invalid decision." }),
  resolutionNote: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ResolveQuestionRequestInput = z.infer<typeof resolveQuestionRequestSchema>;
