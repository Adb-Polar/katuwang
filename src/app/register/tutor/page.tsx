import { getAllowedEmailDomains } from "@/lib/settings";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

// The accepted-domain list is an admin setting, so read it per request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register as Tutor | Katuwang",
  description: "Sign up as a Student Tutor to share knowledge and guide others.",
};

export default async function TutorRegisterPage() {
  const allowedEmailDomains = await getAllowedEmailDomains();

  return (
    <AuthLayout>
      <div className="w-full space-y-4">
        <RegisterForm type="TUTOR" allowedEmailDomains={allowedEmailDomains} />
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
