import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

export const metadata = {
  title: "Privacy Policy | Katuwang",
  description: "How Katuwang collects, uses, and protects student data under RA 10173.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen w-full bg-base-200 font-sans py-10 px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandMark />
          <h1 className="font-sans text-2xl font-semibold text-base-content">Privacy Policy</h1>
          <p className="text-xs text-base-content/60">Last updated 2026-09-14</p>
        </div>

        <section className="card kt-card">
          <div className="card-body gap-6 p-6 md:p-8 text-sm leading-relaxed text-base-content/80">
            <div className="flex items-start gap-3 rounded-xl bg-info/10 border border-info/20 p-4 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-info" />
              <p>
                Katuwang is built around the double-blind anonymity required by RA 10173 (the Data Privacy
                Act of 2012). Learners and tutors are matched and interact using anonymous IDs
                (e.g. <span className="font-mono">STU-0001</span>, <span className="font-mono">TUT-0001</span>) —
                neither side sees the other&apos;s real name, email, or contact details.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-base-content mb-1">What we collect</h2>
              <p>
                When you register, we collect your name, email address, grade level, section, and (optionally)
                a phone or guardian contact number. This information is used only to operate the platform:
                creating your account, matching you with classes or students, and letting an administrator
                reach you or your guardian if needed.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-base-content mb-1">Who can see what</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Learners and tutors see each other only by anonymous ID, grade, and section.</li>
                <li>
                  Administrators can see real names and contact details, solely for account moderation,
                  registration approval, and handling abuse reports.
                </li>
                <li>Your password is never stored in plain text — it is hashed before it ever touches our database.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-base-content mb-1">Consent</h2>
              <p>
                Registration requires confirming that a parent or guardian has consented to the account being
                created, since Katuwang serves Junior and Senior High School students. Personal information is
                used solely for academic support purposes.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-base-content mb-1">Data retention &amp; your rights</h2>
              <p>
                We keep account data for as long as the account is active. Under RA 10173, you (or your
                parent/guardian) may request access to, correction of, or deletion of your personal data by
                contacting your school administrator.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-base-content mb-1">Contact</h2>
              <p>
                Questions about this policy or a data request should go to your school&apos;s Katuwang
                administrator.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to registration
          </Link>
        </div>
      </div>
    </main>
  );
}
