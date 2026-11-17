"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatDate, SCHOOL_TIME_ZONE } from "@/lib/datetime";
import LoadErrorState from "@/components/ui/LoadErrorState";
import LoadingRow from "@/components/ui/LoadingRow";
import Pagination from "@/components/ui/Pagination";

type LearnerCertificate = {
  id: string; certificateNumber: string; tutorName: string;
  subjectName: string; classCode: string; completedAt: string; pdfReady: boolean;
};

const NO_FILTERS: Record<string, string> = {};
const dateParts = new Intl.DateTimeFormat("en-PH", { timeZone: SCHOOL_TIME_ZONE, day: "numeric", month: "short", year: "numeric" });

function CompletedDate({ at }: { at: string }) {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date(at)).map(p => [p.type, p.value]));
  return (
    <time dateTime={at} className="w-14 shrink-0 flex flex-col items-center text-center">
      <span className="sr-only">Completed {formatDate(at)}</span>
      <span aria-hidden="true" className="font-serif text-3xl leading-tight">{parts.day}</span>
      <span aria-hidden="true" className="text-sm text-(--kt-muted)">{parts.month} {parts.year}</span>
    </time>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="card kt-card"><div className="kt-card-body gap-3">{children}</div></section>;
}

/** The learner's own certificates, one date-led row each. Admins and the dashboard preview use CertificateList. */
export default function LearnerCertificateList() {
  const { data: certificates, total, page, pageSize, setPage, setPageSize, loading, loadError, refetch } = usePaginatedList<LearnerCertificate>(
    "/api/certificates", "certificates", NO_FILTERS, 20, "Certificates could not be loaded.", "certificates",
  );

  if (loading) return <Panel><LoadingRow /></Panel>;
  if (loadError) return <Panel><LoadErrorState message={loadError} onRetry={refetch} /></Panel>;
  if (certificates.length === 0) {
    return (
      <Panel>
        <p>When your tutor marks a class complete, its certificate shows up here.</p>
        <Link href="/learner/my-classes" className="btn btn-primary self-start">See my classes</Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card kt-card" aria-label="Certificates">
        <ol>
          {certificates.map(c => (
            <li key={c.id} className="flex gap-4 sm:gap-5 px-4 sm:px-5 py-5 border-b border-(--kt-border) last:border-b-0">
              <CompletedDate at={c.completedAt} />
              <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5">
                <h3 className="font-serif text-lg font-medium leading-snug">{c.subjectName}</h3>
                <p className="text-sm text-(--kt-muted)">
                  <span className="whitespace-nowrap">Class {c.classCode}</span> · <span className="whitespace-nowrap">Tutor {c.tutorName}</span>
                </p>
                <p className="text-sm text-(--kt-muted) max-w-full">
                  Certificate no. <span className="font-serif text-base-content break-all">{c.certificateNumber}</span>
                </p>
                {c.pdfReady
                  ? <a className="btn btn-outline mt-1.5" href={`/api/certificates/${c.id}/download`} download>Download PDF</a>
                  : <p className="text-sm text-(--kt-muted)">Your PDF is still being made. Check back in a few minutes.</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
      {total > pageSize && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </div>
  );
}
