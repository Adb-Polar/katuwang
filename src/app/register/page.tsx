import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeading from "@/components/auth/AuthHeading";

export const metadata = {
  title: "Create an account | Katuwang",
  description: "Create an account to join Katuwang as a Student Learner or Student Tutor.",
};

// Same two choices, and the same words, as the landing page's join section.
const ROLES = [
  {
    href: "/register/learner",
    role: "Learner",
    question: "Need help?",
    body: "Open to every student in Grades 7–12.",
    colour: "text-secondary",
    rule: "border-l-secondary",
  },
  {
    href: "/register/tutor",
    role: "Tutor",
    question: "Good at a subject?",
    body: "Grades 7–12 can apply, pass a topic test, and earn service hours.",
    colour: "text-[var(--lp-tutor)]",
    rule: "border-l-accent",
  },
];

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthHeading kicker="Sumali" title="How do you want to take part?" />

      <ul className="flex flex-col gap-3">
        {ROLES.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className={`group flex items-center justify-between gap-4 rounded-(--lp-radius) border border-(--lp-border) border-l-4 ${r.rule} px-5 py-4 hover:border-(--lp-muted)`}
            >
              <span className="flex flex-col gap-1">
                <span className={`text-sm font-medium ${r.colour}`}>{r.role}</span>
                <span className="font-[family-name:var(--lp-font-serif)] text-xl">{r.question}</span>
                <span className="text-sm text-(--lp-muted)">{r.body}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-(--lp-muted) group-hover:text-(--lp-ink)" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="lp-form-foot">
        Already have an account?{" "}
        <Link href="/login" className="lp-link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
