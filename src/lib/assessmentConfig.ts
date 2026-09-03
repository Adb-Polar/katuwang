/**
 * Platform-wide fallback tuning for topic assessments. The live values are
 * stored as `PlatformSetting` rows and read via `getAssessmentConfig()` in
 * `src/lib/settings.ts`; these are the defaults used when a row is missing or
 * unparseable.
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
