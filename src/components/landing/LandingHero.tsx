import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

export default function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="max-w-3xl mx-auto px-6 pt-10 pb-8 lg:pt-16 flex flex-col items-center text-center gap-5">
      <p className="font-mono text-2xs uppercase tracking-widest text-primary">Peer tutoring platform · Grades 7–12</p>
      <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-heavy tracking-tight leading-[1.08] max-w-[20ch]">
        From first question to measurable progress.
      </h1>
      <p className="text-base text-(--kt-muted) leading-relaxed max-w-xl">
        Follow a single tutoring session on Katuwang: how a student is matched with a verified peer tutor, and how
        learning is measured, with every identity kept private.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {signedIn ? (
          <Link href="/dashboard" className="btn btn-primary px-6 text-sm">
            Go to your portal <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link href="/register" className="btn btn-primary px-6 text-sm">
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn px-6 text-sm bg-base-100">
              Log in
            </Link>
          </>
        )}
      </div>

      <Link href="#story" className="mt-6 flex flex-col items-center gap-1 font-mono text-2xs text-(--kt-faint)">
        <ArrowDown className="w-4 h-4" />
        see how it works
      </Link>
    </header>
  );
}
