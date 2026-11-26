const DEFAULT_SEED_TRANSACTION_TIMEOUT_MS = 10 * 60_000;

/**
 * Time limit for a seed's single transaction. The seeds are all-or-nothing, and against a
 * remote database every statement costs a network round trip, so the limit is generous.
 * Override with SEED_TRANSACTION_TIMEOUT_MS on an unusually slow connection.
 */
export const SEED_TRANSACTION_TIMEOUT_MS = (() => {
  const fromEnv = Number(process.env.SEED_TRANSACTION_TIMEOUT_MS);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_SEED_TRANSACTION_TIMEOUT_MS;
})();
