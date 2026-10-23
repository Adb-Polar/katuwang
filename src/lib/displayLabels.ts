/** Human-readable fallback for archived subject slugs that are no longer in the live catalog. */
export function subjectDisplayLabel(slug: string): string {
  if (slug === "SHS_21ST_CENT_LIT") return "21st Century Literature from the Philippines and the World";
  if (slug === "TLE" || slug === "MAPEH") return slug;
  return slug.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusDisplayLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
