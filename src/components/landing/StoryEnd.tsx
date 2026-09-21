import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StoryEnd({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16 lg:py-20 text-center">
      <h2 className="font-sans text-3xl sm:text-4xl font-heavy tracking-tight mb-2">Get started with Katuwang.</h2>
      <p className="text-sm text-(--kt-muted) mb-6">Free for students in Grades 7–12. Register as a learner or apply to tutor.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {signedIn ? (
          <Link href="/dashboard" className="btn btn-primary px-6 text-sm">
            Go to your portal <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link href="/register" className="btn btn-primary px-6 text-sm">
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register/tutor" className="btn px-6 text-sm bg-base-100">
              Apply as tutor
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
