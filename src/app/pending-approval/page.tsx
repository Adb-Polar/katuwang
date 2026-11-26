import Link from "next/link";
import { Clock } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeading from "@/components/auth/AuthHeading";

export const metadata = {
  title: "Account Pending Approval | Katuwang",
  description: "Your Katuwang account is awaiting administrator approval.",
};

export default function PendingApprovalPage() {
  return (
    <AuthLayout>
      <span className="lp-status-icon bg-warning/15 text-(--kt-warning-text)">
        <Clock className="h-5 w-5" aria-hidden="true" />
      </span>
      <AuthHeading kicker="Hintay muna" title="Account pending approval">
        Your registration was received, but an administrator still needs to review and approve your account
        before you can sign in.
      </AuthHeading>
      <p className="text-(--lp-muted)">
        Approvals are usually handled within a school day. Try signing in again later, or{" "}
        <Link href="/contact?about=REGISTRATION" className="lp-link">
          contact an administrator
        </Link>{" "}
        if it has been longer than expected.
      </p>
      <p className="lp-form-foot">
        <Link href="/login" className="lp-link">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
