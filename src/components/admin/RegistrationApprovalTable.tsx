"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { Role, GradeLevel } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
import { formatDateTime } from "@/lib/datetime";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

const TAB_ROLE: Record<"all" | "learners" | "tutors", string> = {
  all: "",
  learners: "STUDENT_LEARNER",
  tutors: "STUDENT_TUTOR",
};

interface PendingUser {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  gradeLevel: GradeLevel;
  section: string;
  createdAt: string;
}

export default function RegistrationApprovalTable() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "learners" | "tutors">("all");
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "">("");
  const [success, setSuccess] = useState("");
  const [declineTarget, setDeclineTarget] = useState<PendingUser | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { sort, dir, toggle } = useTableSort("createdAt", "asc", { name: "asc", role: "asc", code: "asc" });

  const {
    data: users,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  } = usePaginatedList<PendingUser>(
    "/api/admin/registrations",
    "users",
    {
      ...(TAB_ROLE[activeTab] ? { role: TAB_ROLE[activeTab] } : {}),
      ...(gradeFilter ? { gradeLevel: gradeFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve pending registrations.",
    "registrations"
  );

  const review = async (user: PendingUser, decision: "APPROVE" | "DECLINE", declineReason = "") => {
    setBusyId(user.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/registrations/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, ...(declineReason ? { reason: declineReason } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review registration.");

      setSuccess(
        decision === "APPROVE"
          ? `${user.anonymousId} approved — they can now sign in.`
          : `${user.anonymousId} declined.`
      );
      setDeclineTarget(null);
      setReason("");
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review registration.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={declineTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Pending Registrations</h2>

          <Tabs
            tabs={[
              { key: "all", label: "All" },
              { key: "learners", label: "Learners" },
              { key: "tutors", label: "Tutors" },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "all" | "learners" | "tutors")}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input input-bordered input-sm w-full sm:max-w-xs text-xs focus:input-primary"
            />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeLevel | "")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Grade Levels</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
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
                    <SortableTh label="ID" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Name" field="name" sort={sort} dir={dir} onSort={toggle} />
                    <th>Email</th>
                    <SortableTh label="Role" field="role" sort={sort} dir={dir} onSort={toggle} />
                    <th>Grade &amp; Section</th>
                    <SortableTh label="Requested" field="createdAt" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="text-sm">
                      <td>
                        <AnonymousIdBadge
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td className="text-base-content/70">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="text-base-content/60">{u.email}</td>
                      <td className="text-base-content/60">
                        {u.role === "STUDENT_TUTOR" ? "Tutor" : "Learner"}
                      </td>
                      <td className="text-base-content/60">
                        {u.gradeLevel.replace("_", " ")} · {u.section}
                      </td>
                      <td className="text-2xs text-base-content/50">{formatDateTime(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => review(u, "APPROVE")}
                            disabled={busyId === u.id}
                            className="btn btn-primary btn-xs text-2xs font-bold cursor-pointer"
                          >
                            {busyId === u.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDeclineTarget(u);
                              setReason("");
                              setError("");
                            }}
                            disabled={busyId === u.id}
                            className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  No accounts awaiting approval.
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

      {declineTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setDeclineTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Decline Registration</h3>
            <p className="text-2xs text-base-content/50 mb-4">
              {declineTarget.anonymousId} · {declineTarget.firstName} {declineTarget.lastName}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <FormField label="Reason" hint="Optional — stored on the account and in the audit log">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this registration being declined?"
                className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => review(declineTarget, "DECLINE", reason)}
                disabled={busyId === declineTarget.id}
                className="btn btn-error btn-sm text-xs cursor-pointer"
              >
                {busyId === declineTarget.id ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Decline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
