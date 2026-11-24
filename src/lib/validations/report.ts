import { z } from "zod";
import type { ReportViolationType } from "@prisma/client";
import { ALL_VIOLATION_VALUES, violationValuesFor } from "@/lib/reportViolations";

const DETAILS_MAX = 1000;
const NOTE_MAX = 500;

const detailsField = z
  .string()
  .trim()
  .max(DETAILS_MAX, `Description cannot exceed ${DETAILS_MAX} characters.`)
  .optional()
  .or(z.literal(""));

const violationsField = (values: [ReportViolationType, ...ReportViolationType[]]) =>
  z.array(z.enum(values)).min(1, "Select at least one reason.").max(values.length, "Too many reasons selected.");

/** "Other" needs an explanation — applied to every report schema. */
const otherNeedsDetails = {
  check: (d: { violations: ReportViolationType[]; details?: string }) =>
    !d.violations.includes("OTHER") || (d.details?.trim().length ?? 0) >= 10,
  params: {
    message: "Describe the issue in at least 10 characters when you choose Other.",
    path: ["details"],
  },
};

// A learner files a report against a tutor or a class.
export const createReportSchema = z
  .object({
    targetType: z.enum(["TUTOR", "CLASS"], { message: "Invalid report target." }),
    // tutor report → the tutor's User id; class report → the TutorClass id
    targetId: z.string().trim().min(1, "Missing report target."),
    violations: violationsField(ALL_VIOLATION_VALUES),
    details: detailsField,
  })
  .refine(otherNeedsDetails.check, otherNeedsDetails.params);

export type CreateReportInput = z.infer<typeof createReportSchema>;

// A tutor files a report against a learner enrolled in one of their classes.
export const createLearnerReportSchema = z
  .object({
    // the learner's User id
    targetId: z.string().trim().min(1, "Missing report target."),
    violations: violationsField(violationValuesFor("LEARNER")),
    details: detailsField,
  })
  .refine(otherNeedsDetails.check, otherNeedsDetails.params);

export type CreateLearnerReportInput = z.infer<typeof createLearnerReportSchema>;

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
