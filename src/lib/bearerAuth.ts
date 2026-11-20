import { timingSafeEqual } from "node:crypto";

/**
 * Checks `Authorization: Bearer <secret>` against a server-only secret in
 * constant time. Fails closed: an unset or empty secret rejects every request.
 */
export function hasValidBearerToken(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  const actual = Buffer.from(authorizationHeader ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
