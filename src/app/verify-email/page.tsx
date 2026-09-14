import { Suspense } from "react";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Verify Email | Katuwang",
  description: "Confirm your Katuwang account email address.",
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="card kt-card w-full max-w-md text-center p-8">
            <span className="loading loading-spinner loading-md text-primary mx-auto"></span>
            <p className="mt-4 text-xs text-base-content/60">Loading...</p>
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
