import { SUBJECT_NAMES } from "./subjectCatalog";
/** Human-readable fallback for archived subject slugs that are no longer in the live catalog. */
export function subjectDisplayLabel(slug: string): string {
  if (SUBJECT_NAMES[slug]) return SUBJECT_NAMES[slug];
  if (slug === "SHS_21ST_CENT_LIT") return "21st Century Literature from the Philippines and the World";
  if (slug === "TLE" || slug === "MAPEH") return slug;
  return slug.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Replaces subject codes inside a sentence with their names ("enrolled in your JHS_ARALING_PANLIPUNAN class" →
 * "enrolled in your Araling Panlipunan class"). Notification messages were stored with the raw codes.
 */
export function readableSubjects(text: string): string {
  const isSubjectCode = (token: string) => Boolean(SUBJECT_NAMES[token]) || /^(?:JHS|SHS|SSHS)_[A-Z0-9_]+$/.test(token);
  return text.replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*\b/g, (token) => (isSubjectCode(token) ? subjectDisplayLabel(token) : token));
}

/** Keeps codes like "C-0241" or "STU-0329" from breaking at the hyphen when a message wraps (adds a word joiner). */
export function keepCodesTogether(text: string): string {
  return text.replace(/\b([A-Z]{1,4})-(?=\d)/g, "$1-\u2060");
}

export function statusDisplayLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_STATUS_CHANGE: "User Status Changed",
  CLASS_STATUS_CHANGE: "Class Status Changed",
  CERTIFICATION_APPROVED: "Certification Approved",
  CERTIFICATION_REJECTED: "Certification Rejected",
  USER_APPROVED: "Registration Approved",
  USER_DECLINED: "Registration Declined",
};

export function auditActionDisplayLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? statusDisplayLabel(action);
}
