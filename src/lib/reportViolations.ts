import type { ReportViolationType } from "@prisma/client";

// Single source of truth for the report checklist: which reasons a reporter can
// tick for each target (learners report tutors and classes; tutors report learners), the label shown next to each checkbox, and the label the
// admin queue renders. `OTHER` always appears last and reveals the free-text box.

export interface ViolationOption {
  value: ReportViolationType;
  label: string;
}

const TUTOR_VIOLATIONS: ViolationOption[] = [
  { value: "HARASSMENT_OR_BULLYING", label: "Harassment, bullying or intimidation" },
  { value: "ANONYMITY_BREACH", label: "Asked for my real name, contact details or socials" },
  { value: "SOLICITING_PAYMENT", label: "Asked for payment, gifts or a bribe" },
  { value: "DISCRIMINATION", label: "Discriminatory or hateful remarks" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate or explicit content" },
  { value: "UNPROFESSIONAL_CONDUCT", label: "Unprofessional or disrespectful conduct" },
  { value: "NO_SHOW_OR_ABSENCE", label: "Repeated no-shows or unexplained absence" },
  { value: "MISLEADING_ACADEMIC_INFO", label: "Taught false or misleading information" },
  { value: "OTHER", label: "Other (describe below)" },
];

const CLASS_VIOLATIONS: ViolationOption[] = [
  { value: "MISLEADING_CLASS_INFO", label: "Class details are misleading or inaccurate" },
  { value: "OFF_TOPIC_SESSIONS", label: "Sessions were off-topic or not as described" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate or explicit content" },
  { value: "NO_SHOW_OR_ABSENCE", label: "Sessions were skipped or never held" },
  { value: "SCHEDULE_ABUSE", label: "Constant rescheduling or unreasonable timing" },
  { value: "SPAM_OR_DUPLICATE", label: "Spam, duplicate or fake class" },
  { value: "OTHER", label: "Other (describe below)" },
];

/** What a tutor can report a learner for. */
const LEARNER_VIOLATIONS: ViolationOption[] = [
  { value: "DISRUPTIVE_BEHAVIOR", label: "Disrupts sessions or other learners" },
  { value: "HARASSMENT_OR_BULLYING", label: "Harassment, bullying or intimidation" },
  { value: "ANONYMITY_BREACH", label: "Asked for my real name, contact details or socials" },
  { value: "DISCRIMINATION", label: "Discriminatory or hateful remarks" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate or explicit content" },
  { value: "ACADEMIC_DISHONESTY", label: "Cheating on a test or copying work" },
  { value: "REPEATED_ABSENCE", label: "Enrolls, then repeatedly does not attend" },
  { value: "OTHER", label: "Other (describe below)" },
];

export type ReportTarget = "TUTOR" | "CLASS" | "LEARNER";

export const REPORT_VIOLATIONS: Record<ReportTarget, ViolationOption[]> = {
  TUTOR: TUTOR_VIOLATIONS,
  CLASS: CLASS_VIOLATIONS,
  LEARNER: LEARNER_VIOLATIONS,
};

export const LEARNER_VIOLATION_VALUES = LEARNER_VIOLATIONS.map((v) => v.value) as [
  ReportViolationType,
  ...ReportViolationType[],
];

// Every value that may legitimately arrive in a learner's report body — the union of the
// tutor and class lists. Used as the Zod enum source.
export const ALL_VIOLATION_VALUES = Array.from(
  new Set([...TUTOR_VIOLATIONS, ...CLASS_VIOLATIONS].map((v) => v.value))
) as [ReportViolationType, ...ReportViolationType[]];

export const VIOLATION_LABEL: Record<ReportViolationType, string> = Object.fromEntries(
  [...TUTOR_VIOLATIONS, ...CLASS_VIOLATIONS, ...LEARNER_VIOLATIONS].map((v) => [v.value, v.label])
) as Record<ReportViolationType, string>;

/** Human label for a violation value, falling back to the raw value if unknown. */
export function violationLabel(type: string): string {
  return VIOLATION_LABEL[type as ReportViolationType] ?? type;
}
