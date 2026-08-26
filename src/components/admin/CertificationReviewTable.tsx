"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { useFetchList } from "@/hooks/useFetchList";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PendingCertification {
  id: string;
  subject: SubjectArea;
  topic: string;
  requestedAt: string;
  tutor: Tutor;
}

export default function CertificationReviewTable() {
  const { data: certifications, loading, error, setError, refetch } = useFetchList<PendingCertification>(
    "/api/admin/certifications",
    "Could not retrieve certification requests."
  );
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<PendingCertification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingCertification | null>(null);
  const [saving, setSaving] = useState(false);

  const review = async (certification: PendingCertification, status: "CERTIFIED" | "REJECTED") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/certifications/${certification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review certification.");

      setSuccess(
        status === "CERTIFIED"
          ? `${certification.tutor.anonymousId} is now certified for "${certification.topic}".`
          : `Certification request for "${certification.topic}" was rejected.`
      );
      setApproveTarget(null);
      setRejectTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review certification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={approveTarget || rejectTarget ? null : error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Pending Certification Requests</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
                    <th>Tutor</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Requested</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id} className="text-xs">
                      <td>
                        <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                        <div className="text-2xs text-base-content/50 mt-1">
                          {c.tutor.firstName} {c.tutor.lastName}
                        </div>
                      </td>
                      <td className="text-base-content/70">{c.subject}</td>
                      <td className="text-base-content/70">{c.topic}</td>
                      <td className="text-base-content/60">
                        {new Date(c.requestedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="flex gap-2 justify-end">
                        <button
                          onClick={() => setApproveTarget(c)}
                          className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(c)}
                          className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {certifications.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-xs">
                  No pending certification requests.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={approveTarget !== null}
        title="Approve this certification?"
        description={
          approveTarget
            ? `${approveTarget.tutor.anonymousId} will be certified for "${approveTarget.topic}" (${approveTarget.subject}).`
            : undefined
        }
        confirmLabel="Approve"
        tone="default"
        loading={saving}
        onConfirm={() => approveTarget && review(approveTarget, "CERTIFIED")}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject this certification request?"
        description={
          rejectTarget
            ? `The request for "${rejectTarget.topic}" will be removed. The tutor may request it again.`
            : undefined
        }
        confirmLabel="Reject"
        tone="danger"
        loading={saving}
        onConfirm={() => rejectTarget && review(rejectTarget, "REJECTED")}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
