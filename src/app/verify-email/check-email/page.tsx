import Link from "next/link";
import { MailCheck, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import BrandMark from "@/components/ui/BrandMark";
import ResendVerificationButton from "@/components/auth/ResendVerificationButton";

export const metadata = {
  title: "Check Your Email | Katuwang",
  description: "Confirm your Katuwang account by verifying your email address.",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return (
    <AuthLayout>
      <div className="card kt-card w-full max-w-md">
        <div className="card-body gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <BrandMark />
            <h1 className="font-sans text-xl font-semibold text-base-content">Check your email</h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-info/15 text-info flex items-center justify-center">
              <MailCheck className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed">
              {email ? (
                <>
                  We sent a verification link to <span className="font-semibold">{email}</span>. Open it to
                  finish setting up your account.
                </>
              ) : (
                "We sent a verification link to your email address. Open it to finish setting up your account."
              )}
            </p>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Didn&apos;t get it? Check your spam folder, or request a new link below.
            </p>
          </div>

          <ResendVerificationButton email={email} />

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
    </AuthLayout>
  );
}
