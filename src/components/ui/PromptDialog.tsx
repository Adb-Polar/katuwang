"use client";

import ValidatedForm from "./ValidatedForm";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import CharCount from "./CharCount";
import Modal from "./Modal";

/**
 * `ConfirmDialog` + a note textarea: the "confirm this action and optionally
 * (or mandatorily) type a note" modal that the admin moderation tables each
 * hand-rolled. Owns the note state; `onConfirm` receives the trimmed text.
 */
export default function PromptDialog({
  open,
  title,
  description,
  noteLabel = "Note (optional)",
  notePlaceholder,
  noteMax = 500,
  noteRequired = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  noteLabel?: string;
  notePlaceholder?: string;
  noteMax?: number;
  /** When true an empty note blocks submission and receives inline feedback. */
  noteRequired?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  // Reset the note each time the dialog opens/closes — the "adjust state on prop
  // change during render" pattern, so the component can stay mounted.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setNote("");
  }

  const confirmDisabled = loading;

  return (
    <Modal open={open} onClose={onCancel} title={title} bare>
      <ValidatedForm onSubmit={(e) => { e.preventDefault(); onConfirm(note.trim()); }}>
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <TriangleAlert className="w-5 h-5 mt-1 text-error shrink-0" aria-hidden="true" />
          )}
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-medium leading-tight text-base-content">{title}</h2>
            {description && <p className="text-sm text-(--kt-muted)">{description}</p>}
          </div>
        </div>

        <label className="form-control mt-4 block">
          <span className="block pb-1.5 text-[0.9rem] font-medium text-base-content">
            {noteLabel}
          </span>
          <textarea
            required={noteRequired}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={noteMax}
            placeholder={notePlaceholder}
            className="textarea textarea-bordered w-full focus:textarea-primary"
          />
          <CharCount value={note} max={noteMax} />
        </label>

        <div className="modal-action pt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className={`btn ${tone === "danger" ? "btn-error" : "btn-primary"}`}
            disabled={confirmDisabled}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel}
          </button>
        </div>
      </ValidatedForm>
    </Modal>
  );
}
