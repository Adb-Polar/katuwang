"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import TopicRequestManager from "./TopicRequestManager";

export default function FindTutorRequests({ defaultGrade }: { defaultGrade: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#requests") setOpen(true);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  return (
    <section id="requests" className="card kt-card">
      <div className="card-body gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="card-title text-sm font-bold"><Inbox className="h-4 w-4 text-primary" /> Can&apos;t find a subject or topic?</h2>
          <p className="mt-1 text-xs text-base-content/60">Request a class so tutors can respond to what you need.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm text-xs" aria-expanded={open} aria-controls="find-tutor-requests" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide requests" : "Request a topic"}
        </button>
      </div>
      {open && <div id="find-tutor-requests" className="px-4 pb-5 sm:px-6"><TopicRequestManager defaultGrade={defaultGrade} /></div>}
    </section>
  );
}
