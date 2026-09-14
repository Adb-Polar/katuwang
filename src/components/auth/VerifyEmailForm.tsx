"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

type Status = "checking" | "success" | "error";

export default function VerifyEmailForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setStatus("error");
        setMessage("This verification link is missing its token.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "This verification link is invalid or has expired.");
          return;
        }
        setStatus("success");
        setMessage(data.message || "Your email address has been verified.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("A network error occurred. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="card kt-card w-full max-w-md">
      <div className="card-body gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <BrandMark />
          <h1 className="font-sans text-xl font-semibold text-base-content">Email verification</h1>
        </div>

        <div className="flex flex-col items-center gap-4">
          {status === "checking" && (
            <>
              <span className="loading loading-ring loading-md text-primary"></span>
              <p className="text-xs text-base-content/60">Confirming your email address...</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                <CheckCircle className="w-6 h-6" strokeWidth={2.25} />
              </div>
              <p className="text-xs text-base-content/70 leading-relaxed">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center">
                <XCircle className="w-6 h-6" strokeWidth={2.25} />
              </div>
              <p className="text-xs text-base-content/70 leading-relaxed">{message}</p>
            </>
          )}
        </div>

        <div className="border-t border-base-200 pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
