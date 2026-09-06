/**
 * `localStorage` keys the app writes on the client, plus a helper to purge the
 * per-user ones on logout so the next person on a shared device doesn't inherit
 * them (RA 10173 hygiene — the chat transcript can contain a learner's phrasing
 * of what they're struggling with).
 */
export const CHAT_HISTORY_KEY = "kt-chat-history";

/** Clear client-side per-user state that must not survive a sign-out. */
export function clearClientSessionData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // private mode / storage disabled — nothing to clear
  }
}
