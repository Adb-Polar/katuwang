import { z } from "zod";

export const MAX_ALLOWED_EMAIL_DOMAINS = 50;

/** Dotted host name ending in a letters-only TLD: "school.edu.ph", never "test.123" or "qwqe". */
const DOMAIN_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/** For `<input pattern>`: rejects "asa@qwqe" and "a@test.123" before the form is submitted. */
export const EMAIL_INPUT_PATTERN = "[^@\\s]+@([A-Za-z0-9\\-]+\\.)+[A-Za-z]{2,}";
export const EMAIL_INPUT_MESSAGE = "Enter a full email address, like name@school.edu.ph.";

export function isValidEmailDomain(domain: string): boolean {
  return DOMAIN_PATTERN.test(domain);
}

/** Accepts commas, spaces or new lines between domains, and a leading "@". */
export function parseAllowedEmailDomains(raw: string | null | undefined): string[] {
  const domains = (raw ?? "")
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return [...new Set(domains)];
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

/** An empty allowlist means every well-formed address is accepted. */
export function isEmailDomainAllowed(email: string, allowedDomains: readonly string[]): boolean {
  return allowedDomains.length === 0 || allowedDomains.includes(emailDomain(email));
}

export function emailDomainNotAllowedMessage(allowedDomains: readonly string[]): string {
  const list = allowedDomains.map((domain) => `@${domain}`).join(", ");
  return `Use an email address from an approved domain: ${list}.`;
}

export const allowedEmailDomainsSchema = z
  .string()
  .max(4000, "The domain list is too long.")
  .transform(parseAllowedEmailDomains)
  .pipe(
    z
      .array(z.string().refine(isValidEmailDomain, { message: "Enter domains like school.edu.ph, separated by commas." }))
      .max(MAX_ALLOWED_EMAIL_DOMAINS, `List at most ${MAX_ALLOWED_EMAIL_DOMAINS} domains.`)
  );
