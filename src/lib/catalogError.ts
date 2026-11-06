import { NextResponse } from "next/server";
export const CATALOG_UNAVAILABLE = "The subject catalog is temporarily unavailable. Please retry.";
export class CatalogUnavailableError extends Error {
  constructor(cause?: unknown) { super(CATALOG_UNAVAILABLE, { cause }); }
}
export function catalogFailureResponse(error: unknown): NextResponse | null {
  return error instanceof CatalogUnavailableError
    ? NextResponse.json({ error: CATALOG_UNAVAILABLE, retryable: true }, { status: 503, headers: { "Retry-After": "5" } })
    : null;
}
