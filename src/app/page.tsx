import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export default function Home() {
  return (
    <main className="min-h-screen bg-base-100">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="font-serif font-semibold tracking-tight">Katuwang</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm text-xs">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm text-xs">
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-10 pb-24 lg:pt-20 lg:pb-32 flex flex-col items-center text-center gap-6">
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Peer tutoring, Grades 7–12</p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-base-content">
          Learn with a peer who gets it.
        </h1>
        <p className="text-sm lg:text-base text-base-content/70 max-w-sm lg:max-w-xl leading-relaxed">
          Katuwang connects Junior and Senior High School students with peer tutors in their own subjects — pick a
          subject, book a class, and learn from a fellow student who&apos;s already been through it.
        </p>

        <Link href="/register" className="btn btn-primary btn-md lg:btn-lg text-sm lg:text-base px-8 mt-2">
          Create Account
        </Link>
        <p className="text-2xs text-base-content/50">
          Already have one?{" "}
          <Link href="/login" className="link link-primary font-semibold">
            Log in
          </Link>
        </p>

        <div className="flex items-center gap-2 text-2xs text-base-content/60 mt-4 pt-6 border-t border-base-200 w-full justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          Your real name stays private — sessions run on an anonymized ID like
          <AnonymousIdBadge id="STU-0842" role="LEARNER" />
        </div>
      </section>

      <footer className="border-t border-base-200">
        <div className="max-w-6xl mx-auto px-6 py-6 text-2xs text-base-content/60 text-center">
          Katuwang — academic match and support portal
        </div>
      </footer>
    </main>
  );
}
