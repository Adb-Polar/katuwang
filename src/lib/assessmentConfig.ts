import type { TopicAssessmentConfig } from "@prisma/client";

/**
 * Global fallback tuning for a topic assessment, used whenever no
 * TopicAssessmentConfig row exists for a (subject, topic) pair.
 */
export const ASSESSMENT_DEFAULTS = {
  questionCount: 5, // questions served per attempt
  passPercent: 80, // % correct required to pass
  minBankSize: 5, // active questions a topic needs before it is assessable
} as const;

export const OPTION_COUNT_MIN = 2;
export const OPTION_COUNT_MAX = 6;

export type ResolvedTopicConfig = {
  questionCount: number;
  passPercent: number;
  minBankSize: number;
};

/** Merge a TopicAssessmentConfig row (or null) with the global defaults. */
export function resolveTopicConfig(
  row: Pick<TopicAssessmentConfig, "questionCount" | "passPercent" | "minBankSize"> | null
): ResolvedTopicConfig {
  return {
    questionCount: row?.questionCount ?? ASSESSMENT_DEFAULTS.questionCount,
    passPercent: row?.passPercent ?? ASSESSMENT_DEFAULTS.passPercent,
    minBankSize: row?.minBankSize ?? ASSESSMENT_DEFAULTS.minBankSize,
  };
}
