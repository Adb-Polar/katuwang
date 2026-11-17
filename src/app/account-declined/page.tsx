import Link from "next/link";
import { XCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeading from "@/components/auth/AuthHeading";

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
      <span className="lp-status-icon bg-error/10 text-error">
        <XCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <AuthHeading kicker="Paumanhin" title="Registration declined">
        An administrator reviewed your registration and did not approve it, so you can&apos;t sign in with this
        account.
      </AuthHeading>

      {reason && (
        <div className="lp-note mb-6">
          <p className="text-sm font-medium text-(--lp-muted)">Reason given</p>
          <p className="mt-1 whitespace-pre-wrap">{reason}</p>
        </div>
      )}

      <p className="text-(--lp-muted)">
        If you think this was a mistake, contact your school administrator. You may register again with corrected
        details.
      </p>

      <p className="lp-form-foot flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/register" className="lp-link">
          Register again
        </Link>
        <Link href="/login" className="lp-link">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
