"use client";

import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { clearClassBrowserCache } from "@/lib/classBrowserCache";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/datetime";
import { formatTimeRange } from "@/lib/sessionTime";
import ReportButton from "@/components/reports/ReportButton";

interface EnrollErrorBody {
  error?: string;
  conflict?: { classCode: string; subject: string; scheduledAt: string; duration: number };
}

/** Names the clashing class and, in the learner's own time zone, when it meets. */
function enrollErrorMessage({ error, conflict }: EnrollErrorBody): string {
  if (!conflict) return error || "Failed to enroll.";
  return `Schedule conflict: this class overlaps ${conflict.classCode} (${conflict.subject}), which you are already enrolled in, on ${formatDate(conflict.scheduledAt)} at ${formatTimeRange(conflict)}.`;
}

export default function LearnerClassActions({
  classId,
  status,
  isEnrolled,
  isFull,
  reportLabel,
}: {
  classId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  isEnrolled: boolean;
  isFull: boolean;
  /** Anonymised class label ("MATH · C-0231") for the report modal; report shown only when enrolled. */
  reportLabel: string;
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
      if (!res.ok) throw new Error(enrollErrorMessage(data));
      clearClassBrowserCache();
      toast.success("You are enrolled in this class.");
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
      toast.success("You have left the class.");
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
        <span className="text-2xs text-error/80 italic">
          Enrollment is frozen while this class is under moderation.
        </span>
      )}

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

      {isEnrolled && (
        <ReportButton targetType="CLASS" targetId={classId} targetLabel={reportLabel} />
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
