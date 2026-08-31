import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Set a New Password | Katuwang Portal",
  description: "Choose a new password for your Katuwang account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="card bg-base-100 w-full max-w-md shadow-xl border border-base-200 text-center p-8">
            <span className="loading loading-spinner loading-md text-primary mx-auto"></span>
            <p className="mt-4 text-xs text-base-content/60">Loading form...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
