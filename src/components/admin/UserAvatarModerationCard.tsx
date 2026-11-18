"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CameraOff, AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import UserAvatar from "@/components/profile/UserAvatar";
import { formatDateTime } from "@/lib/datetime";
import Modal from "@/components/ui/Modal";
import StatusText from "@/components/ui/StatusText";

const ACTION_TITLES = {
  WARN: "Send a profile picture warning",
  REMOVE: "Remove profile picture",
  LOCK: "Lock profile picture uploads",
  UNLOCK: "Unlock profile picture uploads",
} as const;

interface UserAvatarModerationCardProps {
  userId: string;
  userName: string;
  initialImage?: string | null;
  locked?: boolean;
  updatedAt?: string | null;
}

export default function UserAvatarModerationCard({
  userId,
  userName,
  initialImage,
  locked = false,
  updatedAt,
}: UserAvatarModerationCardProps) {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(initialImage ?? null);
  const [isLocked, setIsLocked] = useState(locked);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"WARN" | "REMOVE" | "LOCK" | "UNLOCK" | null>(null);
  const [reason, setReason] = useState("");

  const openActionModal = (action: "WARN" | "REMOVE" | "LOCK" | "UNLOCK") => {
    setPendingAction(action);
    setReason("");
    setError("");
    setModalOpen(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    if (pendingAction === "WARN" && !reason.trim()) {
      setError("Please provide a reason for the warning.");
      return;
    }

    setLoadingAction(pendingAction);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${userId}/avatar-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pendingAction, reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to perform avatar action.");

      if (pendingAction === "REMOVE") {
        setImage(null);
        setSuccess("Profile picture removed and deleted from cloud storage.");
      } else if (pendingAction === "WARN") {
        setSuccess("Warning notification delivered to user.");
      } else if (pendingAction === "LOCK") {
        setIsLocked(true);
        setSuccess("User profile picture editing locked.");
      } else if (pendingAction === "UNLOCK") {
        setIsLocked(false);
        setSuccess("User profile picture editing unlocked.");
      }

      setModalOpen(false);
      router.refresh();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to perform action.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section className="card kt-card">
      <div className="card-body gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">Profile picture</h2>
          {isLocked && <StatusText tone="warning" label="Uploads locked" />}
        </div>

        <FeedbackBanner variant="success" message={success || null} />
        <FeedbackBanner variant="error" message={error || null} />

        <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
          <UserAvatar
            src={image}
            name={userName}
            size="xl"
            modalTitle={`${userName} - Profile Picture`}
          />

          <div className="flex-1 text-center sm:text-left space-y-1">
            <p className="font-medium text-base-content">
              {image ? "Picture uploaded" : "No profile picture"}
            </p>
            <p className="text-sm text-(--kt-muted)">
              {image
                ? updatedAt
                  ? `Uploaded on ${formatDateTime(updatedAt)}`
                  : "Upload date not recorded."
                : "The user shows their anonymous monogram."}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => openActionModal("WARN")}
                disabled={Boolean(loadingAction)}
                className="btn btn-outline btn-warning min-h-11 gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Send warning
              </button>

              {image && (
                <button
                  type="button"
                  onClick={() => openActionModal("REMOVE")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-error min-h-11 gap-1.5"
                >
                  <CameraOff className="w-4 h-4" />
                  Remove picture
                </button>
              )}

              {isLocked ? (
                <button
                  type="button"
                  onClick={() => openActionModal("UNLOCK")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-success min-h-11 gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock uploads
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openActionModal("LOCK")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-error min-h-11 gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  Lock uploads
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { if (!loadingAction) setModalOpen(false); }}
        title={pendingAction ? ACTION_TITLES[pendingAction] : "Profile picture moderation"}
      >
            <p className="text-sm text-(--kt-muted) mt-2">
              {pendingAction === "WARN" &&
                "The user will receive an in-app warning notification prompting them to update their photo."}
              {pendingAction === "REMOVE" &&
                "This will immediately clear the photo and delete it from cloud storage. The user will be notified."}
              {pendingAction === "LOCK" &&
                "The user will be prevented from uploading or changing their photo until unlocked."}
              {pendingAction === "UNLOCK" &&
                "The user will be permitted to upload and manage their photo again."}
            </p>

            <div className="mt-4">
              <label className="label py-1">
                <span className="text-[0.9rem] font-medium text-base-content">
                  {pendingAction === "WARN" ? "Reason (required)" : "Reason or note (optional)"}
                </span>
              </label>
              <textarea
                aria-label={pendingAction === "WARN" ? "Reason for profile picture warning" : "Administrative reason or note"}
                className="textarea textarea-bordered w-full focus:textarea-primary"
                placeholder={
                  pendingAction === "WARN"
                    ? "Explain why the profile picture violates policy..."
                    : "Add an administrative note..."
                }
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost"
                disabled={Boolean(loadingAction)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={Boolean(loadingAction)}
                className={`btn ${
                  pendingAction === "WARN"
                    ? "btn-warning"
                    : pendingAction === "UNLOCK"
                    ? "btn-success"
                    : "btn-error"
                }`}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Working…</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
      </Modal>
    </section>
  );
}
