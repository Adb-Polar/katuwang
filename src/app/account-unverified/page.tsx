import Link from "next/link";
import { MailWarning, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import BrandMark from "@/components/ui/BrandMark";
import ResendVerificationButton from "@/components/auth/ResendVerificationButton";

export const metadata = {
  title: "Verify Your Email | Katuwang",
  description: "Your Katuwang account still needs email verification.",
};

export default async function AccountUnverifiedPage({
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
            <h1 className="font-sans text-xl font-semibold text-base-content">
              Verify your email to continue
            </h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/15 text-warning flex items-center justify-center">
              <MailWarning className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed">
              This account hasn&apos;t confirmed its email address yet. Check your
              inbox for a verification link, or request a new one below.
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
