"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;
const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Certification {
  id: string;
  subject: SubjectArea;
  topic: string;
  status: "PENDING" | "CERTIFIED";
  requestedAt: string;
  certifiedAt: string | null;
  tutor: Tutor;
}

type Tab = "pending" | "certified";
const TAB_STATUS: Record<Tab, string> = { pending: "PENDING", certified: "CERTIFIED" };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CertificationReviewTable() {
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<SubjectArea | "">("");
  const [sort, setSort] = useState("requested");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<Certification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Certification | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data: certifications,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  } = usePaginatedList<Certification>(
    "/api/admin/certifications",
    "certifications",
    {
      status: TAB_STATUS[tab],
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subject ? { subject } : {}),
      sort,
    },
    PAGE_SIZE,
    "Could not retrieve certification requests.",
    "certs"
  );

  const review = async (certification: Certification, status: "CERTIFIED" | "REJECTED") => {
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
          <h2 className="card-title text-sm font-bold">Certification Requests</h2>

          <Tabs
            tabs={[
              { key: "pending", label: "Pending" },
              { key: "certified", label: "Certified" },
            ]}
            active={tab}
            onChange={(key) => setTab(key as Tab)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search topic or tutor ID..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectArea | "")}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="requested">Sort: Requested date</option>
              <option value="certified">Sort: Certified date</option>
              <option value="subject">Sort: Subject</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <th>Tutor</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>{tab === "certified" ? "Certified" : "Requested"}</th>
                    {tab === "pending" && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id} className="text-sm">
                      <td>
                        <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                        <div className="text-2xs text-base-content/50 mt-1">
                          {c.tutor.firstName} {c.tutor.lastName}
                        </div>
                      </td>
                      <td className="text-base-content/70">{c.subject}</td>
                      <td className="text-base-content/70">{c.topic}</td>
                      <td className="text-base-content/60">
                        {tab === "certified"
                          ? c.certifiedAt
                            ? fmt(c.certifiedAt)
                            : "—"
                          : fmt(c.requestedAt)}
                      </td>
                      {tab === "pending" && (
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {certifications.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  {tab === "certified"
                    ? "No certified topics match these filters."
                    : "No pending certification requests."}
                </div>
              )}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
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
