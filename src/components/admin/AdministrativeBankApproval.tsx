"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function AdministrativeBankApproval({ onApproved }: { onApproved: (count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <>
    <div className="flex justify-end"><button className="btn btn-primary btn-sm" onClick={() => { setError(""); setOpen(true); }}>Approve bank for assessments</button></div>
    <Modal open={open} onClose={() => { if (!busy) setOpen(false); }} title="Administrator approval for assessments" size="md">
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError("");
        try {
          const response = await fetch("/api/admin/assessment-questions/approve-bank", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason, administrativeApproval: confirmed }) });
          const result = await response.json();
          if (!response.ok) throw Error(result.error || "Approval failed.");
          setOpen(false); onApproved(result.approvedQuestions);
        } catch (e) { setError(e instanceof Error ? e.message : "Approval failed."); }
        finally { setBusy(false); }
      }}>
        <p className="text-sm">Approve all active, latest, non-demo bank questions for tutor assessments. Catalog membership, choices, answer-key structure, and explanations are checked before any approval is saved.</p>
        <p className="text-sm">This records administrator authorization for assessment use. Academic review remains separate. Approved content is locked; corrections require a new version and approval.</p>
        <FeedbackBanner variant="error" message={error || null} />
        <label className="form-control gap-2"><span>Administrator approval reason</span><textarea aria-label="Administrator approval reason" className="textarea textarea-bordered min-h-24" required minLength={20} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="checkbox checkbox-sm mt-1" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} /><span>I authorize these questions for assessment use as an administrator.</span></label>
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Approving…" : "Approve for assessments"}</button></div>
      </form>
    </Modal>
  </>;
}
