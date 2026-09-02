import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Register as Learner | Katuwang",
  description: "Sign up as a Student Learner to get tutoring support.",
};

export default function LearnerRegisterPage() {
  return (
    <AuthLayout>
      <div className="w-full space-y-4">
        <RegisterForm type="LEARNER" />
        <div className="text-center text-xs text-base-content/60">
          Already have an account?{" "}
          <Link href="/login" className="link link-primary font-semibold">
            Log in here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
