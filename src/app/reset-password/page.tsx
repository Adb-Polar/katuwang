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
      <Suspense fallback={<p className="lp-muted" role="status">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
