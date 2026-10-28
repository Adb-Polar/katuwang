import { SUBJECT_NAMES } from "./subjectCatalog";
/** Human-readable fallback for archived subject slugs that are no longer in the live catalog. */
export function subjectDisplayLabel(slug: string): string {
  if (SUBJECT_NAMES[slug]) return SUBJECT_NAMES[slug];
  if (slug === "SHS_21ST_CENT_LIT") return "21st Century Literature from the Philippines and the World";
  if (slug === "TLE" || slug === "MAPEH") return slug;
  return slug.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
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
