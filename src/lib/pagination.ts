/**
 * Canonical page sizes. A client table and the API route that feeds it import
 * the same constant, so the two can't drift out of lockstep.
 */
export const ADMIN_PAGE_SIZE = 10; // admin/tutor moderation tables
export const BROWSE_PAGE_SIZE = 12; // learner-facing class/tutor browse grids
export const AUDIT_PAGE_SIZE = 25; // long append-only logs (audit log, chatbot misses)
export const DEV_PAGE_SIZE = 8; // dev-only tooling boards

/** Upper bound a client may request via `?pageSize=` on a normal list route. */
export const MAX_PAGE_SIZE = 50;
/** Upper bound for the wider browse grids. */
export const MAX_BROWSE_PAGE_SIZE = 48;
