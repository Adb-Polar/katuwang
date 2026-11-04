import Link from "next/link";
import { Inbox } from "lucide-react";

export default function FindTutorRequests() {
  return (
    <section id="requests" className="card kt-card">
      <div className="card-body gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="card-title text-sm font-bold"><Inbox className="h-4 w-4 text-primary" /> Can&apos;t find a subject or topic?</h2>
          <p className="mt-1 text-xs text-base-content/60">Request a class so tutors can respond to what you need.</p>
        </div>
        <Link href="/learner/tutors?tab=requests" className="btn btn-primary btn-sm text-xs">Request a topic</Link>
      </div>
    </section>
  );
}
