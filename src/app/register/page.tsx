import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { User, GraduationCap } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

export const metadata = {
  title: "Join Katuwang | Register",
  description: "Create an account to join Katuwang as a Student Learner or Student Tutor.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="card kt-card w-full">
        <div className="card-body gap-6 text-center items-center p-8">
          {/* Card Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <BrandMark />
            <h1 className="font-sans text-xl font-semibold tracking-tight text-base-content">Join Katuwang</h1>
            <p className="text-xs text-base-content/60">Select your role to get started.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
            <Link
              href="/register/learner"
              className="flex-1 card bg-secondary text-secondary-content p-5 text-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border border-secondary/10 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2 bg-secondary-content/10 rounded-xl">
                <User className="w-6 h-6 text-secondary-content" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xs">Student Learner</span>
              <span className="text-2xs opacity-80 leading-normal">I need tutoring support matches</span>
            </Link>

            <Link
              href="/register/tutor"
              className="flex-1 card bg-accent/15 border border-accent/30 text-accent-content p-5 text-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2 bg-accent/20 rounded-xl">
                <GraduationCap className="w-6 h-6 text-accent-content" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xs">Student Tutor</span>
              <span className="text-2xs text-accent-content/75 leading-normal">I want to mentor others</span>
            </Link>
          </div>

          <p className="text-xs text-base-content/50 pt-4 border-t border-base-200 w-full mt-2">
            Already have an account?{" "}
            <Link href="/login" className="link link-primary font-bold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
