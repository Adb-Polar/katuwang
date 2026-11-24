import { PERSON_NAME } from "@/lib/validations/textRules";

const WORD_START = /(^|[ '-])(\p{L})/gu;
const COMBINING_MARK = /\p{M}/u;
const COMBINING_MARKS = /\p{M}+/gu;

function isSingleCase(name: string): boolean {
  return name === name.toLowerCase() || name === name.toUpperCase();
}

function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(WORD_START, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase());
}

/**
 * Cleans a typed personal name for storage. Names typed entirely in one case
 * are title-cased; mixed-case input is assumed deliberate ("McDonald") and only
 * gets its first letter capitalized.
 */
export function normalizePersonName(raw: string): string {
  const cleaned = raw
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
  const cased = isSingleCase(cleaned) ? toTitleCase(cleaned) : cleaned;
  return cased.charAt(0).toUpperCase() + cased.slice(1);
}

/**
 * Expects an NFC-normalized name. A combining mark that survives NFC has no
 * composed letter form, so it is decoration (Zalgo, strikethrough) rather than
 * an accent.
 */
export function isValidPersonName(name: string): boolean {
  return PERSON_NAME.regex.test(name) && !COMBINING_MARK.test(name);
}

/**
 * Best-effort fix for an already-stored name: normalizes it and drops
 * decorative combining marks. Returns null when the result is still not a
 * valid name and needs a human to decide.
 */
export function repairPersonName(stored: string): string | null {
  const normalized = normalizePersonName(stored);
  if (isValidPersonName(normalized)) return normalized;
  const stripped = normalizePersonName(normalized.replace(COMBINING_MARKS, ""));
  return isValidPersonName(stripped) ? stripped : null;
}
