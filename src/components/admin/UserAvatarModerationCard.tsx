"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import UserAvatar from "@/components/profile/UserAvatar";
import { formatDateTime } from "@/lib/datetime";

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
        <div className="flex items-center justify-between">
          <h2 className="card-title text-sm font-bold flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Profile Picture Moderation
          </h2>
          {isLocked && (
            <span className="badge badge-warning badge-sm gap-1 text-2xs font-semibold">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
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
            <p className="text-xs font-semibold text-base-content">
              {image ? "Active Cloud Avatar" : "No Profile Picture Set"}
            </p>
            <p className="text-2xs text-base-content/60">
              {image
                ? updatedAt
                  ? `Uploaded on ${formatDateTime(updatedAt)}`
                  : "Hosted on UploadThing CDN"
                : "User is currently displaying their anonymous monogram."}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => openActionModal("WARN")}
                disabled={Boolean(loadingAction)}
                className="btn btn-outline btn-warning btn-xs text-2xs gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                Send Warning
              </button>

              {image && (
                <button
                  type="button"
                  onClick={() => openActionModal("REMOVE")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-error btn-xs text-2xs gap-1 cursor-pointer"
                >
                  <CameraOff className="w-3 h-3" />
                  Remove Picture
                </button>
              )}

              {isLocked ? (
                <button
                  type="button"
                  onClick={() => openActionModal("UNLOCK")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-success btn-xs text-2xs gap-1 cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  Unlock Uploads
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openActionModal("LOCK")}
                  disabled={Boolean(loadingAction)}
                  className="btn btn-outline btn-error btn-xs text-2xs gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  Lock Uploads
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Action Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-sm">
              {pendingAction === "WARN" && "Send Profile Picture Warning"}
              {pendingAction === "REMOVE" && "Forcibly Remove Picture"}
              {pendingAction === "LOCK" && "Lock Profile Picture Uploads"}
              {pendingAction === "UNLOCK" && "Unlock Profile Picture Uploads"}
            </h3>

            <p className="text-xs text-base-content/70 mt-2">
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
                <span className="label-text text-2xs font-semibold">
                  {pendingAction === "WARN" ? "Reason (Required)" : "Reason / Note (Optional)"}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full text-xs"
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
                className="btn btn-ghost btn-sm text-xs"
                disabled={Boolean(loadingAction)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={Boolean(loadingAction)}
                className={`btn btn-sm text-xs ${
                  pendingAction === "WARN"
                    ? "btn-warning"
                    : pendingAction === "UNLOCK"
                    ? "btn-success"
                    : "btn-error"
                }`}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
