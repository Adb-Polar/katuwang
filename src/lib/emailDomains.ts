/**
 * Email-domain allowlist: registration only accepts addresses whose domain an
 * admin has approved. Pure helpers — the stored list is read via
 * `getAllowedEmailDomains()` in `src/lib/settings.ts`.
 */

/** Used until an admin saves a list in Platform Settings. */
export const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "deped.gov.ph"];

export const MAX_ALLOWED_EMAIL_DOMAINS = 50;

// Labels of letters/digits/hyphens separated by dots, ending in an alphabetic
// TLD of 2+ letters — rejects `qwqe` (no TLD) and `test.123` (numeric TLD).
const DOMAIN_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function isValidDomain(domain: string): boolean {
  return DOMAIN_PATTERN.test(domain);
}

/** Splits on commas/whitespace, normalises, and drops blanks and duplicates. */
export function parseDomainList(raw: string): string[] {
  const domains = raw
    .split(/[\s,]+/)
    .map(normalizeDomain)
    .filter(Boolean);
  return [...new Set(domains)];
}

/** The part after the last `@`, lowercased; `""` when there is none. */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

export function isEmailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  return allowedDomains.includes(emailDomain(email));
}

/** User-facing rejection text naming the accepted domains. */
export function domainNotAllowedMessage(email: string, allowedDomains: string[]): string {
  const accepted = allowedDomains.map((d) => `@${d}`).join(", ");
  return `Email addresses from @${emailDomain(email) || "that domain"} are not accepted. Use an address from: ${accepted}.`;
}
