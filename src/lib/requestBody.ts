import type { NextRequest } from "next/server";

/**
 * Parses a request's JSON body, answering `null` for a missing or malformed
 * body instead of throwing. Callers feed the result straight into a Zod
 * schema, so bad JSON surfaces as a 400 validation error rather than a 500.
 */
export async function readJsonBody(req: Request | NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
