/**
 * Turns the query string the login page can arrive with (`?error=…` from a
 * failed Google sign-in, `?reason=…` from the route guard) into what to show.
 * Only fixed, known messages are returned — the raw query text is never
 * rendered, so a crafted link cannot put arbitrary words on the login page.
 */

export interface LoginNotice {
  /** Error text for the banner. */
  message?: string;
  /** Where to send the visitor instead of showing a message. */
  redirectTo?: string;
  /** True when the account is blocked and the admins are the next step. */
  suggestContact?: boolean;
}

const ACCOUNT_DECLINED_PREFIX = "ACCOUNT_DECLINED";

export const LOGIN_MESSAGES = {
  inactive: "Your account is no longer active. Contact an administrator for details.",
  suspended: "Your account has been suspended. Contact an administrator for details.",
  banned: "Your account has been banned. Contact an administrator if you think this is a mistake.",
  googleNoAccount:
    "No Katuwang account uses that Google email. Register first, or sign in with the email you registered with.",
  googleUnverified: "Google has not verified that email address, so it cannot be used to sign in.",
  generic: "Sign-in failed. Please try again.",
} as const;

/** Maps a sign-in error (from a redirect or from `signIn()`'s result) to a notice. */
export function noticeForSignInError(error: string, email = ""): LoginNotice {
  if (error === "ACCOUNT_PENDING") return { redirectTo: "/pending-approval" };
  if (error === "ACCOUNT_UNVERIFIED") {
    return { redirectTo: email ? `/account-unverified?email=${encodeURIComponent(email)}` : "/account-unverified" };
  }
  if (error.startsWith(ACCOUNT_DECLINED_PREFIX)) {
    const reason = error.slice(ACCOUNT_DECLINED_PREFIX.length).replace(/^:/, "").trim();
    return { redirectTo: reason ? `/account-declined?reason=${encodeURIComponent(reason)}` : "/account-declined" };
  }
  if (error === "GOOGLE_NO_ACCOUNT") return { message: LOGIN_MESSAGES.googleNoAccount };
  if (error === "GOOGLE_EMAIL_UNVERIFIED") return { message: LOGIN_MESSAGES.googleUnverified };
  if (/suspended/i.test(error)) return { message: LOGIN_MESSAGES.suspended, suggestContact: true };
  if (/banned/i.test(error)) return { message: LOGIN_MESSAGES.banned, suggestContact: true };
  return { message: LOGIN_MESSAGES.generic };
}

/** The notice for the login page's own query string, or `{}` when there is none. */
export function loginNoticeFromQuery(params: { get(name: string): string | null }): LoginNotice {
  const error = params.get("error");
  if (error) return noticeForSignInError(error);
  if (params.get("reason") === "account-inactive") {
    return { message: LOGIN_MESSAGES.inactive, suggestContact: true };
  }
  return {};
}
