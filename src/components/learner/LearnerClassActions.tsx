"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearClassBrowserCache } from "@/lib/classBrowserCache";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ReportButton from "@/components/reports/ReportButton";
import { useToast } from "@/components/ui/Toast";

export default function LearnerClassActions({
  classId,
  status,
  isEnrolled,
  isFull,
  reportLabel,
  canReport,
}: {
  classId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  isEnrolled: boolean;
  isFull: boolean;
  /** Anonymised class label ("MATH · C-0231") for the report modal; report shown only when enrolled. */
  reportLabel: string;
  canReport?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isModerated = status === "SUSPENDED" || status === "BANNED";

  const handleEnroll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll.");
      clearClassBrowserCache();
      toast("You are enrolled in this class.");
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
      toast("You have left the class.", "success", { awaitNavigation: true });
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

      {isEnrolled && isModerated && (
        <span className="text-sm text-error">
          Enrollment is frozen while this class is under moderation.
        </span>
      )}

      {isEnrolled ? (
        status === "SCHEDULED" && (
          <button
            onClick={() => setConfirmUnenroll(true)}
            disabled={loading}
            className="btn btn-outline btn-error"
          >
            Unenroll
          </button>
        )
      ) : (
        status === "SCHEDULED" && (
          <button
            onClick={handleEnroll}
            disabled={loading || isFull}
            className="btn btn-primary"
          >
            {isFull ? "Class is full" : "Enroll in this class"}
          </button>
        )
      )}

      {(canReport ?? isEnrolled) && (
        <ReportButton targetType="CLASS" targetId={classId} targetLabel={reportLabel} />
      )}

      <ConfirmDialog
        open={confirmUnenroll}
        title="Unenroll from this class?"
        description="You can re-enroll before the first session starts if seats are still available."
        confirmLabel="Unenroll"
        tone="danger"
        loading={loading}
        onConfirm={handleUnenroll}
        onCancel={() => setConfirmUnenroll(false)}
      />
    </>
  );
}
