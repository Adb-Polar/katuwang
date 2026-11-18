import { TriangleAlert } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  description,
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
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} bare>
      <div className="flex items-start gap-3">
        {tone === "danger" && (
          <TriangleAlert className="w-5 h-5 mt-1 text-error shrink-0" aria-hidden="true" />
        )}
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-medium leading-tight text-base-content">{title}</h2>
          {description && <p className="text-sm text-(--kt-muted)">{description}</p>}
        </div>
      </div>
      <div className="modal-action pt-4">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${tone === "danger" ? "btn-error" : "btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
