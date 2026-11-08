"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ValidatedForm from "@/components/ui/ValidatedForm";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export default function QualificationReviewModal({ question, revoke, onClose, onSaved }: {
  question: { id: string; subject: string; topic: string; prompt: string; explanation: string | null; options: { id: string; text: string; isCorrect: boolean }[] };
  revoke: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [competency, setCompetency] = useState("");const [credentials, setCredentials] = useState("");const [evidence, setEvidence] = useState("");const [reason, setReason] = useState("");
  const [error, setError] = useState("");const [saving, setSaving] = useState(false);
  return <Modal open onClose={onClose} title={revoke ? "Revoke qualification review" : "Record qualified topic review"} size="lg">
    <ValidatedForm onSubmit={async event => {
      event.preventDefault();setSaving(true);setError("");
      try {
        const response = await fetch(`/api/admin/assessment-questions/${question.id}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(revoke ? { decision: "REVOKE", reason } : { decision: "APPROVE", competency, reviewerCredentials: credentials, evidence, attestation: true }) });
        const data = await response.json();if (!response.ok) throw new Error(data.error || "Review could not be recorded.");onSaved();
      } catch (error) { setError(error instanceof Error ? error.message : "Review could not be recorded."); }
      finally { setSaving(false); }
    }}>
      <p className="text-xs mb-3">{question.subject} · {question.topic}</p>
      <div className="border border-base-200 rounded-lg p-3 text-xs space-y-2 mb-3"><p>{question.prompt}</p>{question.options.map(option => <p key={option.id}>{option.text}{option.isCorrect ? " (answer key)" : ""}</p>)}<p>Explanation: {question.explanation || "Missing — add a substantive explanation before review."}</p></div>
      <FeedbackBanner variant="error" message={error || null} />
      {revoke ? <label className="form-control"><span className="label-text">Revocation reason</span><textarea aria-label="Revocation reason" required minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} className="textarea textarea-bordered" /></label> : <div className="space-y-3">
        <p className="text-xs">Record an actual qualified review of this version. Demo questions require topic-specific replacement first. Approval locks content; later corrections need a new version and review.</p>
        <label className="form-control"><span className="label-text">Topic competency and curriculum reference</span><textarea aria-label="Topic competency and curriculum reference" required minLength={10} maxLength={2000} value={competency} onChange={event => setCompetency(event.target.value)} className="textarea textarea-bordered" /></label>
        <label className="form-control"><span className="label-text">Qualified reviewer and credentials</span><textarea aria-label="Qualified reviewer and credentials" required minLength={10} maxLength={2000} value={credentials} onChange={event => setCredentials(event.target.value)} className="textarea textarea-bordered" /></label>
        <label className="form-control"><span className="label-text">Review evidence and reference</span><textarea aria-label="Review evidence and reference" required minLength={20} maxLength={4000} value={evidence} onChange={event => setEvidence(event.target.value)} className="textarea textarea-bordered" /></label>
        <label className="flex gap-2 items-start text-xs"><input type="checkbox" required className="checkbox checkbox-sm" />I confirm a qualified reviewer checked this topic-specific competency, answer key, explanation and distractors.</label>
      </div>}
      <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button><button type="submit" disabled={saving} className="btn btn-primary btn-sm">{revoke ? "Revoke review" : "Record review"}</button></div>
    </ValidatedForm>
  </Modal>;
}
