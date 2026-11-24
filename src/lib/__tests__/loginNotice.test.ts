import { describe, it, expect } from "vitest";
import { LOGIN_MESSAGES, loginNoticeFromQuery, noticeForSignInError } from "@/lib/loginNotice";

const query = (init: string) => new URLSearchParams(init);

describe("noticeForSignInError", () => {
  it("redirects a pending account to the approval page", () => {
    expect(noticeForSignInError("ACCOUNT_PENDING")).toEqual({ redirectTo: "/pending-approval" });
  });

  it("redirects a declined account with its reason", () => {
    expect(noticeForSignInError("ACCOUNT_DECLINED:Not a student here")).toEqual({
      redirectTo: "/account-declined?reason=Not%20a%20student%20here",
    });
  });

  it("redirects a declined account without a reason", () => {
    expect(noticeForSignInError("ACCOUNT_DECLINED")).toEqual({ redirectTo: "/account-declined" });
  });

  it("redirects an unverified account, carrying the email when known", () => {
    expect(noticeForSignInError("ACCOUNT_UNVERIFIED", "a@gmail.com").redirectTo).toBe(
      "/account-unverified?email=a%40gmail.com"
    );
    expect(noticeForSignInError("ACCOUNT_UNVERIFIED").redirectTo).toBe("/account-unverified");
  });

  it("suggests contacting an admin for suspended and banned accounts", () => {
    expect(noticeForSignInError("Your account has been suspended. Contact an administrator for details.")).toEqual({
      message: LOGIN_MESSAGES.suspended,
      suggestContact: true,
    });
    expect(noticeForSignInError("Your account has been banned.")).toEqual({
      message: LOGIN_MESSAGES.banned,
      suggestContact: true,
    });
  });

  it("explains a Google email with no account", () => {
    expect(noticeForSignInError("GOOGLE_NO_ACCOUNT").message).toBe(LOGIN_MESSAGES.googleNoAccount);
  });

  it("never echoes unknown text back", () => {
    expect(noticeForSignInError("Click http://evil.example to verify")).toEqual({ message: LOGIN_MESSAGES.generic });
    expect(noticeForSignInError("OAuthCallback")).toEqual({ message: LOGIN_MESSAGES.generic });
  });
});

describe("loginNoticeFromQuery", () => {
  it("is empty for a plain visit", () => {
    expect(loginNoticeFromQuery(query(""))).toEqual({});
  });

  it("explains the route guard's account-inactive redirect", () => {
    expect(loginNoticeFromQuery(query("reason=account-inactive"))).toEqual({
      message: LOGIN_MESSAGES.inactive,
      suggestContact: true,
    });
  });

  it("ignores an unknown reason", () => {
    expect(loginNoticeFromQuery(query("reason=whatever"))).toEqual({});
  });

  it("prefers the error over the reason", () => {
    expect(loginNoticeFromQuery(query("error=GOOGLE_NO_ACCOUNT&reason=account-inactive")).message).toBe(
      LOGIN_MESSAGES.googleNoAccount
    );
  });
});
