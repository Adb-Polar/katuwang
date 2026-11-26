import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeading from "@/components/auth/AuthHeading";

export const metadata = {
  title: "Access Denied | Katuwang",
  description: "You do not have permission to view this page.",
};

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <span className="lp-status-icon bg-error/10 text-error">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <AuthHeading kicker="Bawal dito" title="Access denied">
        You do not have the required permissions to access this page. Please make sure you are logged into the
        correct account.
      </AuthHeading>
      <Link href="/dashboard" className="btn btn-primary w-full">
        Go to your portal
      </Link>
      <p className="lp-form-foot">
        Think this is a mistake?{" "}
        <Link href="/contact" className="lp-link">
          Contact an administrator
        </Link>
      </p>
    </AuthLayout>
  );
}
