import { z } from "zod";
import { isValidPersonName, normalizePersonName } from "@/lib/personName";
import { PERSON_NAME } from "@/lib/validations/textRules";

/**
 * A required personal-name field. Normalizes first so the length and character
 * checks run against the value that will actually be stored.
 */
export function personNameField(label: string, maxLength: number) {
  return z
    .string()
    .transform(normalizePersonName)
    .pipe(
      z
        .string()
        .min(1, `${label} is required.`)
        .max(maxLength, `${label} cannot exceed ${maxLength} characters.`)
        .refine(isValidPersonName, { message: `${label}: ${PERSON_NAME.message}` })
    );
}
