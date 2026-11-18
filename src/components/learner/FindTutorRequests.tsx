import Link from "next/link";

export default function FindTutorRequests() {
  return (
    <section id="requests" className="card kt-card">
      <div className="card-body gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-medium leading-tight">Can&apos;t find a subject or topic?</h2>
          <p className="mt-1 text-sm text-(--kt-muted)">Request a class so tutors can respond to what you need.</p>
        </div>
        <Link href="/learner/tutors?tab=requests" className="btn btn-primary">Request a topic</Link>
      </div>
    </section>
  );
}
