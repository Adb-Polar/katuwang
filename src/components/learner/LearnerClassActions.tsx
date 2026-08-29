"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { clearClassBrowserCache } from "@/lib/classBrowserCache";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function LearnerClassActions({
  classId,
  status,
  isEnrolled,
  isFull,
}: {
  classId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  isEnrolled: boolean;
  isFull: boolean;
}) {
  const router = useRouter();
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnroll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll.");
      clearClassBrowserCache();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unenroll.");
      clearClassBrowserCache();
      router.push("/learner/my-classes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unenroll.");
    } finally {
      setLoading(false);
      setConfirmUnenroll(false);
    }
  };

  return (
    <>
      <FeedbackBanner variant="error" message={error || null} />

      {isEnrolled ? (
        status === "SCHEDULED" && (
          <button
            onClick={() => setConfirmUnenroll(true)}
            disabled={loading}
            className="btn btn-error btn-sm text-xs gap-1 cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            Unenroll
          </button>
        )
      ) : (
        status === "SCHEDULED" && (
          <button
            onClick={handleEnroll}
            disabled={loading || isFull}
            className="btn btn-primary btn-sm text-xs gap-1 cursor-pointer"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isFull ? "Full" : "Enroll"}
          </button>
        )
      )}

      <ConfirmDialog
        open={confirmUnenroll}
        title="Unenroll from this class?"
        description="You can browse and re-enroll later if seats are still available."
        confirmLabel="Unenroll"
        tone="danger"
        loading={loading}
        onConfirm={handleUnenroll}
        onCancel={() => setConfirmUnenroll(false)}
      />
    </>
  );
}
