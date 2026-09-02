import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AssessmentsSummaryCard({
  certifiedCount,
  pendingCount,
}: {
  certifiedCount: number;
  pendingCount: number;
}) {
  return (
    <section className="card kt-card">
      <div className="card-body gap-3">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-sm font-bold">Assessments</h2>
          <Link href="/tutor/assessments" className="link link-primary text-2xs font-bold flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-base-content/60">
          {certifiedCount} verified topic{certifiedCount === 1 ? "" : "s"}, {pendingCount} pending request
          {pendingCount === 1 ? "" : "s"}.
        </p>
      </div>
    </section>
  );
}
