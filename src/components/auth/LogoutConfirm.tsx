"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

export default function LogoutConfirm() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    setLoading(true);
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="card bg-base-100 shadow-2xl border border-base-200">
      <div className="card-body gap-5 text-center items-center p-8">
        <BrandMark />
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <LogOut className="w-8 h-8" strokeWidth={2} />
        </div>
        <h1 className="font-serif text-xl font-semibold tracking-tight text-base-content">
          Sign out of Katuwang?
        </h1>
        <p className="text-xs text-base-content/60 leading-relaxed">
          You&apos;ll need to sign in again to get back into your portal.
        </p>
        <div className="card-actions pt-2 w-full flex-col gap-2">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="btn btn-primary btn-sm w-full cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Signing out...</span>
              </>
            ) : (
              <span>Sign Out</span>
            )}
          </button>
          <Link href="/dashboard" className="btn btn-ghost btn-sm w-full cursor-pointer text-xs">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
