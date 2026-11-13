"use client";
import { useState } from "react";
import Link from "next/link";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatDate, formatDateTime } from "@/lib/datetime";
import FormField from "@/components/ui/FormField";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import LoadErrorState from "@/components/ui/LoadErrorState";
import LoadingRow from "@/components/ui/LoadingRow";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";

type Certificate = {
  id: string; certificateNumber: string; learnerName: string; tutorName: string;
  subjectName: string; classCode: string; completedAt: string; issuedAt: string;
  emailStatus: "PENDING" | "PROCESSING" | "SENT" | "FAILED"; emailSentAt: string | null;
  pdfReady: boolean; attempts?: number; lastError?: string | null;
};
const delivery = { PENDING: "Email queued", PROCESSING: "Processing", SENT: "Email accepted by provider", FAILED: "Delivery needs attention" };
export default function CertificateList({ admin = false, preview = false }: { admin?: boolean; preview?: boolean }) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [classCode, setClassCode] = useState("");
  const [issuedFrom, setIssuedFrom] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const params: Record<string, string> = {
    ...(q ? { q } : {}), ...(subject ? { subject } : {}), ...(classCode ? { classCode } : {}),
    ...(issuedFrom ? { issuedFrom } : {}), ...(issuedTo ? { issuedTo } : {}),
  };
  const { data: certificates, total, page, pageSize, setPage, setPageSize, loading, loadError, error, setError, refetch } = usePaginatedList<Certificate>(
    "/api/certificates", "certificates", params, preview ? 5 : 20, "Certificates could not be loaded.", "certificates",
  );
  async function retry(c: Certificate) {
    setBusy(c.id); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/admin/completion-certificates/${c.id}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Retry could not be queued.");
      setMessage(data.message); setSelected(null); refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "Retry could not be queued."); }
    finally { setBusy(null); }
  }
  const download = (c: Certificate) => c.pdfReady
    ? <a className="btn btn-outline btn-sm min-h-11" href={`/api/certificates/${c.id}/download`} download>Download PDF</a>
    : <span className="text-xs text-base-content/60">PDF being prepared</span>;
  return <section className="card kt-card"><div className="card-body gap-4">
    {preview && <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="card-title text-sm">My Certificates</h2><Link href="/learner/certificates" className="link link-primary text-sm">View all certificates</Link></div>}
    <FeedbackBanner variant="success" message={message || null} />
    <FeedbackBanner variant="error" message={loadError ? null : error || null} />
    {admin && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="Learner or Certificate ID"><input className="input input-bordered w-full" value={q} maxLength={100} onChange={e => setQ(e.target.value)} placeholder="Search certificates" /></FormField>
      <FormField label="Subject"><input className="input input-bordered w-full" value={subject} maxLength={191} onChange={e => setSubject(e.target.value)} /></FormField>
      <FormField label="Class code"><input className="input input-bordered w-full" value={classCode} maxLength={191} onChange={e => setClassCode(e.target.value)} /></FormField>
      <FormField label="Issued from"><input type="date" className="input input-bordered w-full" value={issuedFrom} onChange={e => setIssuedFrom(e.target.value)} /></FormField>
      <FormField label="Issued through"><input type="date" className="input input-bordered w-full" value={issuedTo} min={issuedFrom || undefined} onChange={e => setIssuedTo(e.target.value)} /></FormField>
    </div>}
    <button type="button" className="btn btn-ghost btn-sm self-end" onClick={refetch}>Refresh certificates</button>
    {loading ? <LoadingRow /> : loadError ? <LoadErrorState message={loadError} onRetry={refetch} /> : certificates.length === 0 ? <p className="text-sm text-base-content/60 py-6">
      {admin ? "No certificates match these filters." : "You haven't earned any certificates yet. Complete a tutoring class to receive your first certificate!"}
    </p> : <div className="grid gap-3">
      {certificates.map(c => <article key={c.id} className="flex flex-col gap-3 rounded-xl border border-base-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1 break-words">
          <h3 className="font-semibold text-sm">{c.subjectName} · {c.classCode}</h3>
          {admin && <p className="text-sm">{c.learnerName}</p>}
          <p className="text-sm text-base-content/65">Tutor: {c.tutorName}</p>
          <p className="text-xs text-base-content/65">Completed {formatDate(c.completedAt)}</p>
          <p className="text-xs text-base-content/65">{delivery[c.emailStatus]}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm min-h-11" onClick={() => setSelected(c)}>Details</button>
          {download(c)}
          {admin && c.emailStatus === "FAILED" && <button type="button" className="btn btn-primary btn-sm min-h-11" disabled={busy === c.id} onClick={() => retry(c)}>{busy === c.id ? "Queuing…" : "Retry delivery"}</button>}
        </div>
      </article>)}
    </div>}
    {!preview && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    <Modal open={selected !== null} onClose={() => setSelected(null)} title="Certificate details" size="md">
      {selected && <div className="space-y-3 break-words text-sm">
        <p><strong>Certificate ID:</strong> {selected.certificateNumber}</p>
        <p><strong>Learner:</strong> {selected.learnerName}</p>
        <p><strong>Subject:</strong> {selected.subjectName} · {selected.classCode}</p>
        <p><strong>Tutor:</strong> {selected.tutorName}</p>
        <p><strong>Completed:</strong> {formatDate(selected.completedAt)}</p>
        <p><strong>Issued:</strong> {formatDateTime(selected.issuedAt)}</p>
        <p>{delivery[selected.emailStatus]}{selected.emailSentAt ? ` · ${formatDateTime(selected.emailSentAt)}` : ""}</p>
        {admin && selected.lastError && <p className="text-error">{selected.lastError}</p>}
        {download(selected)}
      </div>}
    </Modal>
  </div></section>;
}
