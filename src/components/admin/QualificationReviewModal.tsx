"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ValidatedForm from "@/components/ui/ValidatedForm";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";

export default function QualificationReviewModal({ question, revoke, onClose, onSaved }: {
  question: { qualificationApprovalMethod?: "ADMIN_APPROVAL" | "QUALIFIED_REVIEW" | null; id: string; subject: string; topic: string; prompt: string; explanation: string | null; options: { id: string; text: string; isCorrect: boolean }[] };
  revoke: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [competency, setCompetency] = useState("");
  const [credentials, setCredentials] = useState("");
  const [evidence, setEvidence] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaClass = "textarea textarea-bordered min-h-20 w-full resize-y text-sm focus:textarea-primary";

  return (
    <Modal open onClose={onClose} title={revoke ? "Revoke assessment approval" : "Record qualified topic review"} size="lg">
      <ValidatedForm className="flex flex-col gap-4" onSubmit={async event => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
          const response = await fetch(`/api/admin/assessment-questions/${question.id}/review`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(revoke
              ? { decision: "REVOKE", reason }
              : { decision: "APPROVE", competency, reviewerCredentials: credentials, evidence, attestation: true }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Review could not be recorded.");
          onSaved();
        } catch (error) {
          setError(error instanceof Error ? error.message : "Review could not be recorded.");
        } finally {
          setSaving(false);
        }
      }}>
        <p className="text-xs text-base-content/60">{question.subject} · {question.topic}</p>
        <div className="space-y-2 rounded-lg border border-base-200 p-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
          <p>{question.prompt}</p>
          {question.options.map(option => <p key={option.id}>{option.text}{option.isCorrect ? " (answer key)" : ""}</p>)}
          <p>Explanation: {question.explanation || "Missing — add a substantive explanation before review."}</p>
        </div>
        <FeedbackBanner variant="error" message={error || null} />

        {revoke ? (
          <FormField label="Revocation reason" required>
            <textarea aria-label="Revocation reason" rows={3} minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} disabled={saving} className={textareaClass} />
          </FormField>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed">Record an actual qualified review of this version. Demo questions require topic-specific replacement first. Approval locks content; later corrections need a new version and review.</p>
            <FormField label="Topic competency and curriculum reference" required>
              <textarea aria-label="Topic competency and curriculum reference" rows={3} minLength={10} maxLength={2000} value={competency} onChange={event => setCompetency(event.target.value)} disabled={saving} className={textareaClass} />
            </FormField>
            <FormField label="Qualified reviewer and credentials" required>
              <textarea aria-label="Qualified reviewer and credentials" rows={3} minLength={10} maxLength={2000} value={credentials} onChange={event => setCredentials(event.target.value)} disabled={saving} className={textareaClass} />
            </FormField>
            <FormField label="Review evidence and reference" required>
              <textarea aria-label="Review evidence and reference" rows={3} minLength={20} maxLength={4000} value={evidence} onChange={event => setEvidence(event.target.value)} disabled={saving} className={textareaClass} />
            </FormField>
            <div data-form-field="Qualified review confirmation" className="space-y-1.5">
              <label className="flex items-start gap-2 text-xs leading-relaxed">
                <input type="checkbox" required disabled={saving} className="checkbox checkbox-sm mt-0.5 shrink-0" />
                <span>I confirm a qualified reviewer checked this topic-specific competency, answer key, explanation and distractors.</span>
              </label>
              <div data-field-feedback />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-base-200 pt-4">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? "Saving…" : revoke ? "Revoke approval" : "Record review"}</button>
        </div>
      </ValidatedForm>
    </Modal>
  );
}
