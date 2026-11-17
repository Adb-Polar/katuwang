import React from "react";
import PublicShell from "@/components/public/PublicShell";
import AuthBackButton from "./AuthBackButton";

/**
 * Shell for every sign-in, sign-up, recovery and account-status page: the public header and
 * footer (same as the landing page) around one centred column. `width="wide"` is for the
 * sign-up form.
 */
export default function AuthLayout({
  children,
  width = "narrow",
}: {
  children: React.ReactNode;
  width?: "narrow" | "wide";
}) {
  return (
    <PublicShell>
      <main className={`lp-auth lp-auth--${width}`}>
        <AuthBackButton />
        {children}
      </main>
    </PublicShell>
  );
}
