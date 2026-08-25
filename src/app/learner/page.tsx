import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

export const metadata = {
  title: "Learner Portal | Katuwang",
};

export default async function LearnerDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Portal"
        title="Welcome back"
        subtitle="Surfacing only anonymized data to protect your identity."
        actions={<AnonymousIdBadge id={session!.user.anonymousId} role="LEARNER" size="md" showIcon />}
      />

      {/* Get started prompt */}
      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-3">
          <h2 className="card-title text-sm font-bold">Get Started</h2>
          <p className="text-xs text-base-content/60">
            Browse tutor-scheduled classes and enroll in the ones that fit your subjects and availability.
          </p>
          <div className="card-actions pt-1">
            <Link href="/learner/classes" className="btn btn-primary btn-sm text-xs">
              Browse Classes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
