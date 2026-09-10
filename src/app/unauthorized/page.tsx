import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Access Denied | Katuwang",
  description: "You do not have permission to view this page.",
};

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <div className="card kt-card">
        <div className="card-body gap-5 text-center items-center p-8">
          <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-base-content">Access Denied</h1>
          <p className="text-xs text-base-content/60 leading-relaxed">
            You do not have the required permissions to access this page. Please make sure you are logged into the correct account.
          </p>
          <div className="card-actions pt-2 w-full">
            <Link
              href="/dashboard"
              className="btn btn-neutral btn-sm w-full cursor-pointer text-xs"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
