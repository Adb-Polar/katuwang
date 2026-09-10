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
          <div className="p-2 rounded-lg bg-error/10 text-error shrink-0">
            <TriangleAlert className="w-4 h-4" strokeWidth={2.5} />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-base-content">{title}</h3>
          {description && <p className="text-xs text-base-content/60">{description}</p>}
        </div>
      </div>
      <div className="modal-action pt-4">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tone === "danger" ? "btn-error" : "btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-xs" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
