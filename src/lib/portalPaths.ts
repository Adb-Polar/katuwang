import type { Role } from "@prisma/client";

/**
 * The one place that knows which URL prefix each role's portal lives under.
 * Use `portalPath(role, "/classes")` instead of hand-rolling a
 * `role === "STUDENT_LEARNER" ? "/learner/…" : …` ternary at each call site.
 */
const PORTAL_PREFIX: Record<Role, string> = {
  STUDENT_LEARNER: "/learner",
  STUDENT_TUTOR: "/tutor",
  ADMIN: "/admin",
};

export function portalPath(role: Role, sub: string): string {
  return `${PORTAL_PREFIX[role]}${sub}`;
}
