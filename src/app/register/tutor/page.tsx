import TutorRegisterForm from "@/components/auth/TutorRegisterForm";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Register as Tutor | Katuwang",
  description: "Sign up as a Student Tutor to share knowledge and guide others.",
};

export default function TutorRegisterPage() {
  return (
    <AuthLayout>
      <div className="w-full space-y-4">
        <TutorRegisterForm />
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
