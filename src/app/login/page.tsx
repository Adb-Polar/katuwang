import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Log in | Katuwang",
  description: "Sign in to Katuwang to manage matches, lessons, and schedules.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="lp-muted" role="status">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
