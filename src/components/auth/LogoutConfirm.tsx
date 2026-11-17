"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import AuthHeading from "./AuthHeading";
import { clearClientSessionData } from "@/lib/clientStorage";

export default function LogoutConfirm() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    setLoading(true);
    clearClientSessionData();
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div>
      <span className="lp-status-icon bg-primary/10 text-primary">
        <LogOut className="h-5 w-5" aria-hidden="true" />
      </span>
      <AuthHeading kicker="Paalam" title="Sign out of Katuwang?">
        You&apos;ll need to sign in again to get back into your portal.
      </AuthHeading>
      <div className="flex flex-col gap-3">
        <button onClick={handleSignOut} disabled={loading} className="btn btn-primary w-full">
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              <span>Signing out...</span>
            </>
          ) : (
            <span>Sign Out</span>
          )}
        </button>
        <Link href="/dashboard" className="btn btn-ghost w-full">
          Cancel
        </Link>
      </div>
    </div>
  );
}
