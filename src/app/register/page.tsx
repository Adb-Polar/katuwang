import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                  <path d="M13 14h3" />
                </svg>
              </div>
              <h2 className="text-xs font-black tracking-wider uppercase text-base-content">Katuwang</h2>
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
                <svg className="w-6 h-6 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 14c4 0 8 2 8 6H4c0-4 4-6 8-6z" />
                  <path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                </svg>
              </div>
              <span className="font-bold text-xs">Student Learner</span>
              <span className="text-[10px] opacity-80 leading-normal">I need tutoring support matches</span>
            </Link>

            <Link
              href="/register/tutor"
              className="flex-1 card bg-primary/10 border border-primary/20 text-primary p-5 text-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2 bg-primary/10 rounded-xl">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 14c4 0 8 2 8 6H4c0-4 4-6 8-6z" />
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
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
