import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export default function PrivacyPayoff() {
  return (
    <section className="bg-neutral text-neutral-content">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 grid gap-10 md:grid-cols-2 md:gap-14 items-center">
        <div>
          <p className="font-mono text-2xs uppercase tracking-widest text-primary-content/70">Privacy by design</p>
          <h2 className="font-sans text-3xl sm:text-4xl font-heavy tracking-tight leading-tight mt-3">
            Learners and tutors never see each other&apos;s real names.
          </h2>
          <p className="text-sm leading-relaxed text-neutral-content/75 mt-4 max-w-md">
            In line with RA 10173, peers see only an anonymous ID, grade level and section. Real identities are visible
            to administrators alone, for account approval and moderation.
          </p>
          <Link
            href="/privacy-policy"
            className="btn px-6 text-sm mt-6 bg-base-100 text-primary border-base-100 hover:bg-base-200"
          >
            Read the privacy policy <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="flex flex-col gap-2.5">
          <SeesRow who={<AnonymousIdBadge id="STU-2071" role="LEARNER" size="md" />} sees="TUT-0148" />
          <SeesRow who={<AnonymousIdBadge id="TUT-0148" role="TUTOR" size="md" />} sees="STU-2071" />
          <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-content/15 px-4 py-3.5">
            <span className="font-mono text-xs">admin</span>
            <span className="font-mono text-2xs text-neutral-content/70">sees → real identities (moderation only)</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function SeesRow({ who, sees }: { who: React.ReactNode; sees: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-content/15 px-4 py-3.5">
      {who}
      <span className="font-mono text-2xs text-neutral-content/70">sees → {sees}</span>
    </li>
  );
}
