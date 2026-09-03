import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import BrandMark from "@/components/ui/BrandMark";

export const metadata = {
  title: "Account Pending Approval | Katuwang",
  description: "Your Katuwang account is awaiting administrator approval.",
};

export default function PendingApprovalPage() {
  return (
    <AuthLayout>
      <div className="card kt-card w-full max-w-md">
        <div className="card-body gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <BrandMark />
            <h1 className="font-serif text-xl font-semibold text-base-content">
              Account pending approval
            </h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/15 text-warning flex items-center justify-center">
              <Clock className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed">
              Your registration was received, but an administrator still needs to
              review and approve your account before you can sign in.
            </p>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Approvals are usually handled within a school day. Try signing in
              again later, or reach out to your school administrator if it has
              been longer than expected.
            </p>
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
    </AuthLayout>
  );
}
