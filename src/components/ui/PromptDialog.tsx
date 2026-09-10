"use client";

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
  /** When true the confirm button stays disabled until the note is non-empty. */
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

  const confirmDisabled = loading || (noteRequired && note.trim().length === 0);

  return (
    <Modal open={open} onClose={onCancel} title={title} bare>
      <div>
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <div className="p-2 rounded-lg bg-error/10 text-error shrink-0">
              <TriangleAlert className="w-4 h-4" strokeWidth={2.5} />
            </div>
          )}
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-base-content">{title}</h3>
            {description && <p className="text-xs text-base-content/60">{description}</p>}
          </div>
        </div>

        <label className="form-control mt-3">
          <span className="label-text text-2xs font-semibold text-base-content/70 pb-1">
            {noteLabel}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={noteMax}
            placeholder={notePlaceholder}
            className="textarea textarea-bordered text-xs w-full focus:textarea-primary"
          />
          <CharCount value={note} max={noteMax} />
        </label>

        <div className="modal-action pt-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tone === "danger" ? "btn-error" : "btn-primary"}`}
            onClick={() => onConfirm(note.trim())}
            disabled={confirmDisabled}
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
