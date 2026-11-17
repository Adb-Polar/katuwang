import PublicShell from "@/components/public/PublicShell";
import AuthBackButton from "@/components/auth/AuthBackButton";

export const metadata = {
  title: "Privacy Policy | Katuwang",
  description: "How Katuwang collects, uses, and protects student data under RA 10173.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <main className="lp-auth max-w-2xl">
        <AuthBackButton />

        <div className="lp-auth-head">
          <p className="lp-kicker" lang="fil">
            Pribado
          </p>
          <h1>Privacy Policy</h1>
          <p>Last updated 2026-11-17</p>
        </div>

        <article className="lp-doc flex flex-col gap-8 leading-relaxed">
          <p className="lp-note">
            Katuwang is built around the double-blind anonymity required by RA 10173 (the Data Privacy Act of
            2012). Learners and tutors are matched and interact using anonymous IDs (e.g.{" "}
            <span className="lp-id lp-id-learner">STU-0001</span>,{" "}
            <span className="lp-id lp-id-tutor">TUT-0001</span>). Tutors never see a learner&apos;s real name,
            email, or contact details. Tutors are shown to learners by ID too, unless your school chooses to show
            tutor names.
          </p>

          <section className="flex flex-col gap-2">
            <h2>What we collect</h2>
            <p>
              When you register, we collect your name, email address, grade level, section, and (optionally) a
              phone or guardian contact number. This information is used only to operate the platform: creating
              your account, matching you with classes or students, and letting an administrator reach you or your
              guardian if needed.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2>Who can see what</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Tutors see learners only by anonymous ID, grade, and section.</li>
              <li>
                Learners see tutors by anonymous ID, grade, and section. If your school&apos;s administrator turns on
                tutor names, learners also see a tutor&apos;s real name. This setting is off by default, and learner
                names are never shown to tutors.
              </li>
              <li>
                Administrators can see real names and contact details, solely for account moderation,
                registration approval, and handling abuse reports.
              </li>
              <li>Your password is never stored in plain text — it is hashed before it ever touches our database.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2>Consent</h2>
            <p>
              Registration requires confirming that a parent or guardian has consented to the account being
              created, since Katuwang serves Junior and Senior High School students. Personal information is used
              solely for academic support purposes.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2>Data retention &amp; your rights</h2>
            <p>
              We keep account data for as long as the account is active. Under RA 10173, you (or your
              parent/guardian) may request access to, correction of, or deletion of your personal data by
              contacting your school administrator.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2>Contact</h2>
            <p>
              Questions about this policy or a data request should go to your school&apos;s Katuwang
              administrator.
            </p>
          </section>
        </article>
      </main>
    </PublicShell>
  );
}
