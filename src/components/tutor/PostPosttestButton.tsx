"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function PostPosttestButton({ classId, sessionId }: { classId: string; sessionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const publish = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "POSTTEST_OPEN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post the post-test.");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post the post-test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button type="button" onClick={() => setConfirming(true)} className="btn btn-primary btn-xs text-2xs font-bold">
          Publish post-test
        </button>
        {error && <span role="alert" className="text-2xs text-error">{error}</span>}
      </div>
      <ConfirmDialog
        open={confirming}
        title="Post the post-test?"
        description="This closes new pre-test starts and opens the post-test to enrolled learners. They will be notified."
        confirmLabel="Publish post-test"
        loading={loading}
        onConfirm={publish}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
