import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import BrandMark from "@/components/ui/BrandMark";

export const metadata = {
  title: "Registration Declined | Katuwang",
  description: "Your Katuwang registration was not approved.",
};

export default async function AccountDeclinedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <AuthLayout>
      <div className="card kt-card w-full max-w-md">
        <div className="card-body gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <BrandMark />
            <h1 className="font-serif text-xl font-semibold text-base-content">
              Registration declined
            </h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center">
              <XCircle className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed">
              An administrator reviewed your registration and did not approve it,
              so you can&apos;t sign in with this account.
            </p>

            {reason && (
              <div className="w-full rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-left">
                <p className="text-2xs font-semibold uppercase tracking-wide text-error/70">
                  Reason given
                </p>
                <p className="mt-1 text-xs text-base-content/80 whitespace-pre-wrap">{reason}</p>
              </div>
            )}

            <p className="text-xs text-base-content/60 leading-relaxed">
              If you think this was a mistake, contact your school administrator.
              You may register again with corrected details.
            </p>
          </div>

          <div className="border-t border-base-200 pt-4 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
            <Link href="/register" className="text-xs font-bold text-base-content/60 hover:text-primary hover:underline">
              Register again
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
