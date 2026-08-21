import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { BookOpen, User, GraduationCap } from "lucide-react";

export const metadata = {
  title: "Join Katuwang | Register",
  description: "Create an account to join Katuwang as a Student Learner or Student Tutor.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="card bg-base-100 w-full shadow-sm border border-base-200">
        <div className="card-body gap-6 text-center items-center p-8">
          {/* Card Header */}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-1.5 justify-center mb-1">
              <div className="p-1 bg-primary/10 rounded-lg text-primary border border-primary/20">
                <BookOpen className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <h2 className="text-xs font-sans font-black tracking-wider uppercase text-base-content">Katuwang</h2>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-base-content">Join Katuwang</h1>
            <p className="text-xs text-base-content/60">Select your role to get started.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
            <Link
              href="/register/learner"
              className="flex-1 card bg-primary text-primary-content p-5 text-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border border-primary/10 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2 bg-white/10 rounded-xl">
                <User className="w-6 h-6 text-primary-content" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xs">Student Learner</span>
              <span className="text-[10px] opacity-80 leading-normal">I need tutoring support matches</span>
            </Link>

            <Link
              href="/register/tutor"
              className="flex-1 card bg-primary/10 border border-primary/20 text-primary p-5 text-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2 bg-primary/10 rounded-xl">
                <GraduationCap className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xs">Student Tutor</span>
              <span className="text-[10px] text-base-content/75 leading-normal">I want to mentor others</span>
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
