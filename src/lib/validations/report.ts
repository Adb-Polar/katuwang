import { z } from "zod";
import { ALL_VIOLATION_VALUES } from "@/lib/reportViolations";

const DETAILS_MAX = 1000;
const NOTE_MAX = 500;

// A learner files a report against a tutor or a class.
export const createReportSchema = z
  .object({
    targetType: z.enum(["TUTOR", "CLASS"], { message: "Invalid report target." }),
    // tutor report → the tutor's User id; class report → the TutorClass id
    targetId: z.string().trim().min(1, "Missing report target."),
    violations: z
      .array(z.enum(ALL_VIOLATION_VALUES))
      .min(1, "Select at least one reason.")
      .max(ALL_VIOLATION_VALUES.length, "Too many reasons selected."),
    details: z
      .string()
      .trim()
      .max(DETAILS_MAX, `Description cannot exceed ${DETAILS_MAX} characters.`)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (d) => !d.violations.includes("OTHER") || (d.details?.trim().length ?? 0) >= 10,
    {
      message: "Describe the issue in at least 10 characters when you choose Other.",
      path: ["details"],
    }
  );

export type CreateReportInput = z.infer<typeof createReportSchema>;

// An admin resolves or dismisses a pending report.
export const reviewReportSchema = z.object({
  decision: z.enum(["RESOLVE", "DISMISS"], { message: "Invalid decision." }),
  resolutionNote: z
    .string()
    .trim()
    .max(NOTE_MAX, `Note cannot exceed ${NOTE_MAX} characters.`)
    .optional()
    .or(z.literal("")),
});

export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
