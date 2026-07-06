import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Sign In | Katuwang Portal",
  description: "Sign in to Katuwang to manage matches, lessons, and schedules.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="card bg-base-100 w-full max-w-md shadow-xl border border-base-200 text-center p-8">
          <span className="loading loading-spinner loading-md text-primary mx-auto"></span>
          <p className="mt-4 text-xs text-base-content/60">Loading form...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
