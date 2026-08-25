"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { useFetchList } from "@/hooks/useFetchList";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getClassStatusBadge, ClassLifecycleStatus } from "@/components/classes/classStatus";

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
}

interface AdminClass {
  id: string;
  subject: SubjectArea;
  topics: string[];
  scheduledAt: string;
  status: ClassLifecycleStatus;
  suspendedReason: string | null;
  tutor: Tutor;
  _count: { enrollments: number };
}

export default function ClassModerationTable() {
  const { data: classes, loading, error, setError, refetch } = useFetchList<AdminClass>(
    "/api/admin/classes",
    "Could not retrieve classes."
  );
  const [success, setSuccess] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<AdminClass | null>(null);
  const [reason, setReason] = useState("");
  const [reinstateTarget, setReinstateTarget] = useState<AdminClass | null>(null);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (classId: string, status: "SUSPENDED" | "SCHEDULED", body: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");

      setSuccess(status === "SUSPENDED" ? "Class suspended." : "Class reinstated.");
      setSuspendTarget(null);
      setReinstateTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={suspendTarget ? null : error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">All Classes</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
                    <th>Subject / Topics</th>
                    <th>Tutor</th>
                    <th>Scheduled</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const { tone, label } = getClassStatusBadge(c.status, false, "Scheduled");
                    return (
                      <tr key={c.id} className="text-xs">
                        <td>
                          <div className="font-semibold text-base-content/80">{c.subject}</div>
                          <div className="text-2xs text-base-content/50">{c.topics.join(", ")}</div>
                        </td>
                        <td>
                          <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                          <div className="text-2xs text-base-content/50 mt-1">
                            {c.tutor.firstName} {c.tutor.lastName}
                          </div>
                        </td>
                        <td className="text-base-content/60">
                          {new Date(c.scheduledAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="text-base-content/60">{c._count.enrollments}</td>
                        <td>
                          <StatusBadge tone={tone} label={label} size="xs" />
                        </td>
                        <td>
                          {c.status === "SCHEDULED" && (
                            <button
                              onClick={() => {
                                setSuspendTarget(c);
                                setReason("");
                                setError("");
                              }}
                              className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {c.status === "SUSPENDED" && (
                            <button
                              onClick={() => setReinstateTarget(c)}
                              className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                            >
                              Reinstate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {classes.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-xs">No classes found.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {suspendTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setSuspendTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Suspend Class</h3>
            <p className="text-2xs text-base-content/50 mb-4">
              {suspendTarget.subject} · {suspendTarget.topics.join(", ")}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <FormField label="Reason" hint="Optional — shown for your own records">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this class being suspended?"
                className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(suspendTarget.id, "SUSPENDED", { reason })}
                disabled={saving}
                className="btn btn-error btn-sm text-xs cursor-pointer"
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={reinstateTarget !== null}
        title="Reinstate this class?"
        description="It will become visible to learners and reopen for enrollment again."
        confirmLabel="Reinstate"
        tone="default"
        loading={saving}
        onConfirm={() => reinstateTarget && updateStatus(reinstateTarget.id, "SCHEDULED")}
        onCancel={() => setReinstateTarget(null)}
      />
    </div>
  );
}
