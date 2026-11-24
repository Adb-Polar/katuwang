// Allowed-character rules for free-text identity and location fields, shared by the
// Zod schemas (server) and the matching `<input pattern>` (client). Each `pattern`
// is written to compile under both the `u` flag (Zod) and the `v` flag browsers use
// for the HTML `pattern` attribute, so the two sides accept exactly the same text.
// Kept dependency-free so client components can import it.

type TextRule = { pattern: string; regex: RegExp; message: string };

function rule(pattern: string, message: string): TextRule {
  return { pattern, regex: new RegExp(`^(?:${pattern})$`, "u"), message };
}

/**
 * Personal names: letters (incl. ñ and accents), spaces, period, apostrophe, hyphen.
 * At most one combining mark per letter, so a decomposed "ñ" passes but stacked
 * marks (Zalgo text) do not.
 */
export const PERSON_NAME = rule(
  "\\p{L}\\p{M}?(?:\\p{L}\\p{M}?|[ .'\\-])*",
  "Use letters, spaces, periods, apostrophes or hyphens only."
);

/** School section names, e.g. "Rizal", "7-A", "STEM 1". */
export const SECTION_NAME = rule(
  "[\\p{L}\\p{M}\\d][\\p{L}\\p{M}\\d \\-]*",
  "Use letters, numbers, spaces or hyphens only."
);

export const LRN_LENGTH = 12;

/** DepEd Learner Reference Number: exactly 12 digits. */
export const LRN = rule(
  `\\d{${LRN_LENGTH}}`,
  `Enter exactly ${LRN_LENGTH} digits.`
);

/** Building or room, e.g. "Bldg. 2", "Rm 101", "Annex B/3", "#4". */
export const LOCATION_TEXT = rule(
  "[\\p{L}\\p{M}\\d#][\\p{L}\\p{M}\\d .#\\-\\/]*",
  "Use letters, numbers, spaces or . # - / only."
);
