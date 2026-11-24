import { PERSON_NAME } from "@/lib/validations/textRules";

const WORD_START = /(^|[ '-])(\p{L})/gu;
const COMBINING_MARK = /\p{M}/u;

function isSingleCase(name: string): boolean {
  return name === name.toLowerCase() || name === name.toUpperCase();
}

function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(WORD_START, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase());
}

/**
 * Cleans a typed personal name for storage. Only names typed entirely in one
 * case are re-cased; mixed-case input is assumed deliberate ("McDonald").
 */
export function normalizePersonName(raw: string): string {
  const cleaned = raw
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
  return isSingleCase(cleaned) ? toTitleCase(cleaned) : cleaned;
}

/**
 * Expects an NFC-normalized name. A combining mark that survives NFC has no
 * composed letter form, so it is decoration (Zalgo, strikethrough) rather than
 * an accent.
 */
export function isValidPersonName(name: string): boolean {
  return PERSON_NAME.regex.test(name) && !COMBINING_MARK.test(name);
}
